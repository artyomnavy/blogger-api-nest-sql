import { Injectable } from '@nestjs/common';
import {
  PostMapperModel,
  PostOutputModel,
} from '../api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { likesStatuses } from '../../../utils';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class PostsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async getAllPosts(queryData: {
    query: PaginatorModel;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
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

    const userId = queryData.userId;

    const query = `SELECT
                p."id", p."title", p."shortDescription", p."content", p."blogId",
                p."createdAt", b."name" AS "blogName",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                 WHERE l."postId"=p."id" AND l."status"=$1) AS "likesCount",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                 WHERE l."postId"=p."id" AND l."status"=$2) AS "dislikesCount",
                (SELECT l."status" FROM public."LikesPosts" AS l
                 WHERE l."postId"=p."id" AND l."userId"=$3 AND $3 IS NOT NULL) AS "myStatus",
                ARRAY(SELECT json_build_object('addedAt', l."addedAt", 'userId', l."userId",
                'login', u."login") FROM public."LikesPosts" AS l
                LEFT JOIN public."Users" AS u ON l."userId"=u."id"
                WHERE l."postId"=p."id" AND l."status"=$1
                ORDER BY l."addedAt" DESC
                LIMIT $4) AS "newestLikes"
                FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $5 OFFSET $6`;

    const posts = await this.dataSource.query(query, [
      likesStatuses.like,
      likesStatuses.dislike,
      userId,
      3,
      +pageSize,
      (+pageNumber - 1) * +pageSize,
    ]);

    const totalCount = await this.dataSource.query(
      `SELECT COUNT(*) FROM public."Posts"`,
    );

    const pagesCount = Math.ceil(+totalCount[0].count / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount[0].count,
      items: await Promise.all(
        posts.map((post: PostMapperModel) => this.postMapper(post)),
      ),
    };
  }
  async getPostById(
    id: string,
    userId?: string,
  ): Promise<PostOutputModel | null> {
    const query = `SELECT
                p."id", p."title", p."shortDescription", p."content",
                p."blogId", p."createdAt", b."name" AS "blogName",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                WHERE l."postId"=$1 AND l."status"=$2) AS "likesCount",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                WHERE l."postId"=$1 AND l."status"=$3) AS "dislikesCount",
                (SELECT l."status" FROM public."LikesPosts" AS l 
                WHERE l."postId"=$1 AND l."userId"=$4 AND $4 IS NOT NULL) AS "myStatus",
                ARRAY(SELECT json_build_object('addedAt', l."addedAt", 'userId', l."userId",
                'login', u."login") FROM public."LikesPosts" AS l
                LEFT JOIN public."Users" AS u ON l."userId"=u."id"
                WHERE l."postId"=$1 AND l."status"=$2
                ORDER BY l."addedAt" DESC
                LIMIT $5) AS "newestLikes"
                FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                WHERE p."id" = $1`;

    const post = await this.dataSource.query(query, [
      id,
      likesStatuses.like,
      likesStatuses.dislike,
      userId,
      3,
    ]);

    if (!post.length) {
      return null;
    } else {
      return await this.postMapper(post[0]);
    }
  }
  async getPostsByBlogId(queryData: {
    query: PaginatorModel;
    blogId: string;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
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
    const blogId = queryData.blogId;
    const userId = queryData.userId;

    const query = `SELECT
                p."id", p."title", p."shortDescription", p."content", p."blogId",
                p."createdAt", b."name" AS "blogName",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                WHERE l."postId"=p."id" AND l."status"=$1) AS "likesCount",
                (SELECT COUNT(*) FROM public."LikesPosts" AS l
                WHERE l."postId"=p."id" AND l."status"=$2) AS "dislikesCount",
                (SELECT l."status" FROM public."LikesPosts" AS l
                WHERE l."postId"=p."id" AND l."userId"=$3 AND $3 IS NOT NULL) AS "myStatus",
                ARRAY(SELECT json_build_object('addedAt', l."addedAt", 'userId', l."userId",
                'login', u."login") FROM public."LikesPosts" AS l
                LEFT JOIN public."Users" AS u ON l."userId"=u."id"
                WHERE l."postId"=p."id" AND l."status"=$1
                ORDER BY l."addedAt" DESC
                LIMIT $4) AS "newestLikes"
                FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                WHERE p."blogId"=$5
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $6 OFFSET $7`;

    const posts = await this.dataSource.query(query, [
      likesStatuses.like,
      likesStatuses.dislike,
      userId,
      3,
      blogId,
      +pageSize,
      (+pageNumber - 1) * +pageSize,
    ]);

    const totalCount = await this.dataSource.query(
      `SELECT COUNT(*) FROM public."Posts"
                WHERE "blogId"=$1`,
      [blogId],
    );

    const pagesCount = Math.ceil(+totalCount[0].count / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount[0].count,
      items: await Promise.all(
        posts.map((post: PostMapperModel) => this.postMapper(post)),
      ),
    };
  }
  async postMapper(post: PostMapperModel): Promise<PostOutputModel> {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: +post.likesCount || 0,
        dislikesCount: +post.dislikesCount || 0,
        myStatus: post.myStatus || likesStatuses.none,
        newestLikes:
          post.newestLikes.length > 0
            ? [
                {
                  addedAt: post.newestLikes[0].addedAt,
                  userId: post.newestLikes[0].userId,
                  login: post.newestLikes[0].login,
                },
              ]
            : [],
      },
    };
  }
}
