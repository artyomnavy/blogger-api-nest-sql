import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { LikesCommentsQueryRepository } from '../../likes/infrastructure/likes-comments/likes-comments.query-repository';
import { likesStatuses } from '../../../utils';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    protected likesCommentsQueryRepository: LikesCommentsQueryRepository,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getCommentById(
    id: string,
    userId?: string,
  ): Promise<CommentOutputModel | null> {
    const query = `SELECT
                "id", "content", "userId", "userLogin", "createdAt", "postId"
                FROM public."Comments" 
                WHERE "id" = $1`;

    const comment = await this.dataSource.query(query, [id]);

    if (!comment.length) {
      return null;
    } else {
      return await this.commentMapper(comment[0], userId);
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
                "id", "content", "userId", "userLogin", "createdAt", "postId"
                FROM public."Comments"
                WHERE "postId"=$1
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $2 OFFSET $3`;

    const comments = await this.dataSource.query(query, [
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
        comments.map((comment: CommentModel) =>
          this.commentMapper(comment, userId),
        ),
      ),
    };
  }
  async commentMapper(comment: CommentModel, userId?: string) {
    let likeStatus: string | null = null;

    if (userId) {
      const like =
        await this.likesCommentsQueryRepository.getLikeForCommentUser(
          comment.id,
          userId,
        );

      if (like) {
        likeStatus = like.status;
      }
    }

    const likesCount =
      await this.likesCommentsQueryRepository.getCountLikeForComment(
        comment.id,
        likesStatuses.like,
      );

    const dislikesCount =
      await this.likesCommentsQueryRepository.getCountLikeForComment(
        comment.id,
        likesStatuses.dislike,
      );

    return {
      id: comment.id,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: likesCount,
        dislikesCount: dislikesCount,
        myStatus: likeStatus || likesStatuses.none,
      },
    };
  }
}
