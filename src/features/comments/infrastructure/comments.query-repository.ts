import { Injectable } from '@nestjs/common';
import {
  CommentMapperModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { likesStatuses } from '../../../utils';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async getCommentById(
    id: string,
    userId?: string | null,
  ): Promise<CommentOutputModel | null> {
    // Запрос с подзапросами
    // const query = `SELECT
    //             c."id", c."content", c."userId", c."userLogin", c."createdAt", c."postId",
    //             -- Подзапрос количества лайков комментария
    //             (SELECT COUNT(*) FROM public."LikesComments" AS l
    //             WHERE l."commentId"=$1 AND l."status"=$2) AS "likesCount",
    //             -- Подзапрос количества дизлайков комментария
    //             (SELECT COUNT(*) FROM public."LikesComments" AS l
    //             WHERE l."commentId"=$1 AND l."status"=$3) AS "dislikesCount",
    //             -- Подзапрос статуса пользователя (лайк или дизлайк) для комментария
    //             (SELECT l."status" FROM public."LikesComments" AS l
    //             WHERE l."commentId"=$1 AND l."userId"=$4 AND $4 IS NOT NULL) AS "myStatus"
    //             FROM public."Comments" AS c
    //             WHERE c."id" = $1`;

    // Запрос с CTE (common table expressions)
    const query = `WITH
                                            "LikesCounts" AS (
                                              SELECT l."commentId", COUNT(*) FILTER (WHERE l."status"=$2) AS "likesCount",
                                              COUNT(*) FILTER (WHERE l."status"=$3) AS "dislikesCount"
                                              FROM public."LikesComments" AS l
                                              WHERE l."commentId"=$1
                                              GROUP BY l."commentId"
                                              ),
                                            "MyStatus" AS (
                                              SELECT l."commentId", l."status" AS "myStatus"
                                              FROM public."LikesComments" AS l
                                              WHERE l."commentId"=$1 AND l."userId"=$4 AND $4 IS NOT NULL
                                              )
                                            SELECT c."id", c."content", c."userId", c."userLogin", c."createdAt", c."postId",
                                            lc."likesCount", lc."dislikesCount", ms."myStatus"
                                            FROM public."Comments" AS c
                                              LEFT JOIN "LikesCounts" AS lc ON c."id"=lc."commentId"
                                              LEFT JOIN "MyStatus" AS ms ON c."id"=ms."commentId"
                                            --WHERE c."id"=$1`;

    const comment = await this.dataSource.query(query, [
      id,
      likesStatuses.like,
      likesStatuses.dislike,
      userId,
    ]);

    if (!comment.length) {
      return null;
    } else {
      return await this.commentMapper(comment[0]);
    }
  }
  async getCommentsByPostId(
    queryData: { query: PaginatorModel } & { postId: string } & {
      userId?: string;
    },
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? queryData.query.sortDirection
      : 'desc';
    const postId = queryData.postId;
    const userId = queryData.userId;

    const query = `SELECT
                c."id", c."content", c."userId", c."userLogin", c."createdAt", c."postId",
                -- Подзапрос количества лайков комментария
                (SELECT COUNT(*) FROM public."LikesComments" AS l
                WHERE l."commentId"=c."id" AND l."status"=$1) AS "likesCount",
                -- Подзапрос количества дизлайков комментария
                (SELECT COUNT(*) FROM public."LikesComments" AS l
                WHERE l."commentId"=c."id" AND l."status"=$2) AS "dislikesCount",
                -- Подзапрос статуса пользователя (лайк или дизлайк) для комментария
                (SELECT "status" FROM public."LikesComments" AS l
                WHERE l."commentId"=c."id" AND l."userId"=$3 AND $3 IS NOT NULL) AS "myStatus"
                FROM public."Comments" AS c
                WHERE c."postId"=$4
                ORDER BY c."${sortBy}" ${sortDirection}
                LIMIT $5 OFFSET $6`;

    const comments = await this.dataSource.query(query, [
      likesStatuses.like,
      likesStatuses.dislike,
      userId,
      postId,
      +pageSize,
      (+pageNumber - 1) * +pageSize,
    ]);

    const totalCount = await this.dataSource.query(
      `SELECT COUNT(*) FROM public."Comments"
                WHERE "postId"=$1`,
      [postId],
    );

    const pagesCount = Math.ceil(+totalCount[0].count / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount[0].count,
      items: await Promise.all(
        comments.map((comment: CommentMapperModel) =>
          this.commentMapper(comment),
        ),
      ),
    };
  }
  async commentMapper(
    comment: CommentMapperModel,
  ): Promise<CommentOutputModel> {
    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: +comment.likesCount,
        dislikesCount: +comment.dislikesCount,
        myStatus: comment.myStatus || likesStatuses.none,
      },
    };
  }
}
