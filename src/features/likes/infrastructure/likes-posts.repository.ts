import { Injectable } from '@nestjs/common';
import {
  LikePostModel,
  LikePostOutputModel,
} from '../api/models/like-post.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikePost } from '../domain/like-post.entity';

@Injectable()
export class LikesPostsRepository {
  constructor(
    @InjectRepository(LikePost)
    private readonly likesPostsRepository: Repository<LikePost>,
  ) {}
  async createLikeForPost(
    likePost: LikePostModel,
  ): Promise<LikePostOutputModel> {
    await this.likesPostsRepository
      .createQueryBuilder()
      .insert()
      .into(LikePost)
      .values(likePost)
      .execute();

    return {
      ...likePost,
      addedAt: likePost.addedAt.toISOString(),
    };
  }
  async deleteLikeForPost(postId: string, userId: string): Promise<boolean> {
    const resultDeleteLikeStatus = await this.likesPostsRepository
      .createQueryBuilder()
      .delete()
      .from(LikePost)
      .where('postId = :postId AND userId = :userId', { postId, userId })
      .execute();

    return resultDeleteLikeStatus.affected === 1;
  }
  async updateLikeForPost(
    postId: string,
    userId: string,
    updateData: {
      status: string;
      addedAt: Date;
    },
  ): Promise<boolean> {
    const resultUpdateLikeStatus = await this.likesPostsRepository
      .createQueryBuilder()
      .update(LikePost)
      .set({
        status: updateData.status,
        addedAt: updateData.addedAt,
      })
      .where('postId = :postId AND userId = :userId', {
        postId,
        userId,
      })
      .execute();

    return resultUpdateLikeStatus.affected === 1;
  }
}
