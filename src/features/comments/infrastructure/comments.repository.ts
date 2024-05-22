import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { CreateAndUpdateCommentModel } from '../api/models/comment.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LikeStatuses } from '../../../utils';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}
  async createComment(
    newComment: CommentModel,
    userLogin: string,
  ): Promise<CommentOutputModel> {
    // await this.commentsRepository.insert(newComment);

    await this.commentsRepository
      .createQueryBuilder()
      .insert()
      .into(Comment)
      .values(newComment)
      .execute();

    return {
      id: newComment.id,
      content: newComment.content,
      commentatorInfo: {
        userId: newComment.userId,
        userLogin: userLogin,
      },
      createdAt: newComment.createdAt.toISOString(),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatuses.NONE,
      },
    };
  }
  async updateComment(
    id: string,
    updateData: CreateAndUpdateCommentModel,
  ): Promise<boolean> {
    // const resultUpdateComment = await this.commentsRepository.update(id, {
    //   content: updateData.content,
    // });

    const resultUpdateComment = await this.commentsRepository
      .createQueryBuilder()
      .update(Comment)
      .set({
        content: updateData.content,
      })
      .where('id = :id', { id })
      .execute();

    return resultUpdateComment.affected === 1;
  }
  async deleteComment(id: string): Promise<boolean> {
    // const resultDeleteComment = await this.commentsRepository.delete(id);

    const resultDeleteComment = await this.commentsRepository
      .createQueryBuilder()
      .delete()
      .from(Comment)
      .where('id = :id', { id })
      .execute();

    return resultDeleteComment.affected === 1;
  }
}
