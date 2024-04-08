import { Injectable } from '@nestjs/common';
import {
  LikeCommentModel,
  LikeCommentOutputModel,
} from '../api/models/like-comment.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeComment } from '../domain/like-comment.entity';

@Injectable()
export class LikesCommentsRepository {
  constructor(
    @InjectRepository(LikeComment)
    private readonly likesCommentsRepository: Repository<LikeComment>,
  ) {}
  async createLikeForComment(
    likeComment: LikeCommentModel,
  ): Promise<LikeCommentOutputModel> {
    await this.likesCommentsRepository
      .createQueryBuilder()
      .insert()
      .into(LikeComment)
      .values(likeComment)
      .execute();

    return {
      ...likeComment,
      addedAt: likeComment.addedAt.toISOString(),
    };
  }
  async deleteLikeForComment(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const resultDeleteLikeStatus = await this.likesCommentsRepository
      .createQueryBuilder()
      .delete()
      .from(LikeComment)
      .where('commentId = :commentId AND userId = :userId', {
        commentId,
        userId,
      })
      .execute();

    return resultDeleteLikeStatus.affected === 1;
  }
  async updateLikeForComment(
    commentId: string,
    userId: string,
    updateData: {
      status: string;
      addedAt: Date;
    },
  ): Promise<boolean> {
    const resultUpdateLikeStatus = await this.likesCommentsRepository
      .createQueryBuilder()
      .update(LikeComment)
      .set({
        status: updateData.status,
        addedAt: updateData.addedAt,
      })
      .where('commentId = :commentId AND userId = :userId', {
        commentId,
        userId,
      })
      .execute();

    return resultUpdateLikeStatus.affected === 1;
  }
}
