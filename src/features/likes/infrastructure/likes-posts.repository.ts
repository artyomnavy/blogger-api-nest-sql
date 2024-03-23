import { Injectable } from '@nestjs/common';
import {
  LikePostModel,
  LikePostOutputModel,
} from '../api/models/like-post.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesPostsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createLikeForPost(
    inputData: LikePostModel,
  ): Promise<LikePostOutputModel> {
    const query = `INSERT INTO public."LikesPosts"(
            "id", "postId", "userId", "status", "addedAt")
            VALUES ($1, $2, $3, $4, $5)`;

    await this.dataSource.query(query, [
      inputData.id,
      inputData.postId,
      inputData.userId,
      inputData.status,
      inputData.addedAt,
    ]);

    return {
      ...inputData,
      addedAt: inputData.addedAt.toISOString(),
    };
  }
  async deleteLikeForPost(postId: string, userId: string): Promise<boolean> {
    const query = `DELETE FROM public."LikesPosts"
             WHERE "postId" = $1 AND "userId" = $2`;

    const resultDeleteLikeStatus = await this.dataSource.query(query, [
      postId,
      userId,
    ]);

    return resultDeleteLikeStatus[1] === 1;
  }
  async updateLikeForPost(updateData: LikePostModel): Promise<boolean> {
    const query = `UPDATE public."LikesPosts"
            SET "status"=$1, "addedAt"=$2
            WHERE "postId" = $3 AND "userId" = $4`;

    const resultUpdateLikeStatus = await this.dataSource.query(query, [
      updateData.status,
      updateData.addedAt,
      updateData.postId,
      updateData.userId,
    ]);

    return resultUpdateLikeStatus[1] === 1;
  }
}
