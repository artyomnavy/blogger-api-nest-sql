import { Injectable } from '@nestjs/common';
import { PostModel, PostOutputModel } from '../api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { likesStatuses } from '../../../utils';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LikesPostsQueryRepository } from '../../likes/infrastructure/likes-posts/likes-posts.query-repository';

@Injectable()
export class PostsQueryRepository {
  constructor(
    protected likesPostsQueryRepository: LikesPostsQueryRepository,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
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
                p."id", p."title", p."shortDescription", p."content", p."blogId", p."createdAt",
                b."name" AS "blogName" FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $1 OFFSET $2`;

    const posts = await this.dataSource.query(query, [
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
        posts.map((post: PostModel) => this.postMapper(post, userId)),
      ),
    };
  }

  async getPostById(
    id: string,
    userId?: string,
  ): Promise<PostOutputModel | null> {
    const query = `SELECT
                p."id", p."title", p."shortDescription", p."content", p."blogId", p."createdAt",
                b."name" AS "blogName" FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                WHERE p."id" = $1`;

    const post = await this.dataSource.query(query, [id]);

    if (!post.length) {
      return null;
    } else {
      return await this.postMapper(post[0], userId);
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
                p."id", p."title", p."shortDescription", p."content", p."blogId", p."createdAt",
                b."name" AS "blogName" FROM public."Posts" AS p
                LEFT JOIN public."Blogs" AS b ON p."blogId"=b."id"
                WHERE p."blogId"=$1
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $2 OFFSET $3`;

    const posts = await this.dataSource.query(query, [
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
        posts.map((post: PostModel) => this.postMapper(post, userId)),
      ),
    };
  }
  async postMapper(post: PostModel, userId?: string): Promise<PostOutputModel> {
    let likeStatus: string | null = null;

    if (userId) {
      const like = await this.likesPostsQueryRepository.getLikeForPostUser(
        post.id,
        userId,
      );

      if (like) {
        likeStatus = like.status;
      }
    }

    const likesCount = await this.likesPostsQueryRepository.getCountLikeForPost(
      post.id,
      likesStatuses.like,
    );

    const dislikesCount =
      await this.likesPostsQueryRepository.getCountLikeForPost(
        post.id,
        likesStatuses.dislike,
      );

    const newestLikes =
      await this.likesPostsQueryRepository.getNewestLikesForPost(post.id);

    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName!,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: likesCount,
        dislikesCount: dislikesCount,
        myStatus: likeStatus || likesStatuses.none,
        newestLikes: newestLikes,
      },
    };
  }
}
