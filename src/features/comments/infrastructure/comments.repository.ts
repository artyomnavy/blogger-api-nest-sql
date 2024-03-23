import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { CreateAndUpdateCommentModel } from '../api/models/comment.input.model';
import { CommentsQueryRepository } from './comments.query-repository';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { likesStatuses } from '../../../utils';

@Injectable()
export class CommentsRepository {
  constructor(
    protected commentsQueryRepository: CommentsQueryRepository,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async createComment(newComment: CommentModel): Promise<CommentOutputModel> {
    const query = `INSERT INTO public."Comments"(
            "id", "content", "userId", "userLogin", "createdAt", "postId")
            VALUES ($1, $2, $3, $4, $5, $6)`;

    await this.dataSource.query(query, [
      newComment.id,
      newComment.content,
      newComment.userId,
      newComment.userLogin,
      newComment.createdAt,
      newComment.postId,
    ]);

    return await this.commentsQueryRepository.commentMapper({
      ...newComment,
      likesCount: '0',
      dislikesCount: '0',
      myStatus: likesStatuses.none,
    });
  }
  async updateComment(
    id: string,
    updateData: CreateAndUpdateCommentModel,
  ): Promise<boolean> {
    const query = `UPDATE public."Comments"
            SET "content"=$1
            WHERE "id" = $2`;

    const resultUpdateComment = await this.dataSource.query(query, [
      updateData.content,
      id,
    ]);

    return resultUpdateComment[1] === 1;
  }
  async deleteComment(id: string): Promise<boolean> {
    const query = `DELETE FROM public."Comments"
             WHERE "id" = $1`;

    const resultDeleteComment = await this.dataSource.query(query, [id]);

    return resultDeleteComment[1] === 1;
  }
}
