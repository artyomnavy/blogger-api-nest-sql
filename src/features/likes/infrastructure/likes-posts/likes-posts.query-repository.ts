import { Injectable } from '@nestjs/common';
import { likesStatuses } from '../../../../utils';
import { NewestLikesOutputModel } from '../../../posts/api/models/post.output.model';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { LikeCommentModel } from '../../api/models/like-comment.output.model';
import { LikePostModel } from '../../api/models/like-post.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesPostsQueryRepository {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getLikeForPostUser(
    postId: string,
    userId: string,
  ): Promise<LikeCommentModel | null> {
    const query = `SELECT
                "id", "postId", "userId", "status", "addedAt"
                FROM public."LikesPosts" 
                WHERE "postId" = $1 AND "userId" = $2`;

    const like = await this.dataSource.query(query, [postId, userId]);

    if (!like.length) {
      return null;
    } else {
      return like[0];
    }
  }
  async getNewestLikesForPost(
    postId: string,
  ): Promise<NewestLikesOutputModel[]> {
    const query = `SELECT
                "id", "postId", "userId", "status", "addedAt"
                FROM public."LikesPosts"
                WHERE "postId"=$1 AND "status"=$2
                ORDER BY "addedAt" DESC
                LIMIT $3`;

    const newestLikes = await this.dataSource.query(query, [
      postId,
      likesStatuses.like,
      3,
    ]);

    return await Promise.all(
      newestLikes.map((like: LikePostModel) => this.newestLikeMapper(like)),
    );
  }
  async getCountLikeForPost(postId: string, status: string): Promise<number> {
    const query = `SELECT COUNT(*) FROM public."LikesPosts"
                WHERE "postId"=$1 AND "status" = $2`;

    const countLike = await this.dataSource.query(query, [postId, status]);

    return +countLike[0].count;
  }
  async newestLikeMapper(like: LikePostModel) {
    const userId = like.userId;

    const user = await this.usersQueryRepository.getUserById(userId);

    const login = user!.login;

    return {
      addedAt: like.addedAt.toISOString(),
      userId: userId,
      login: login,
    };
  }
}
