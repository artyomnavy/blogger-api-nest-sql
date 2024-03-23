import { Injectable } from '@nestjs/common';
import {
  LikeCommentModel,
  LikeCommentOutputModel,
} from '../api/models/like-comment.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesCommentsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createLikeForComment(
    inputData: LikeCommentModel,
  ): Promise<LikeCommentOutputModel> {
    const query = `INSERT INTO public."LikesComments"(
            "id", "commentId", "userId", "status", "addedAt")
            VALUES ($1, $2, $3, $4, $5)`;

    await this.dataSource.query(query, [
      inputData.id,
      inputData.commentId,
      inputData.userId,
      inputData.status,
      inputData.addedAt,
    ]);

    return {
      ...inputData,
      addedAt: inputData.addedAt.toISOString(),
    };
  }
  async deleteLikeForComment(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const query = `DELETE FROM public."LikesComments"
             WHERE "commentId" = $1 AND "userId" = $2`;

    const resultDeleteLikeStatus = await this.dataSource.query(query, [
      commentId,
      userId,
    ]);

    return resultDeleteLikeStatus[1] === 1;
  }
  async updateLikeForComment(updateData: LikeCommentModel): Promise<boolean> {
    const query = `UPDATE public."LikesComments"
            SET "status"=$1, "addedAt"=$2
            WHERE "commentId" = $3 AND "userId" = $4`;

    const resultUpdateLikeStatus = await this.dataSource.query(query, [
      updateData.status,
      updateData.addedAt,
      updateData.commentId,
      updateData.userId,
    ]);

    return resultUpdateLikeStatus[1] === 1;
  }
}
