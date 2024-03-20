import { Injectable } from '@nestjs/common';
import { LikeCommentModel } from '../../api/models/like-comment.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesCommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async getLikeForCommentUser(
    commentId: string,
    userId: string,
  ): Promise<LikeCommentModel | null> {
    const query = `SELECT
                "id", "commentId", "userId", "status", "addedAt"
                FROM public."LikesComments" 
                WHERE "commentId" = $1 AND "userId" = $2`;

    const like = await this.dataSource.query(query, [commentId, userId]);

    if (!like.length) {
      return null;
    } else {
      return like[0];
    }
  }
  async getCountLikeForComment(
    commentId: string,
    status: string,
  ): Promise<number> {
    const query = `SELECT COUNT(*) FROM public."LikesComments"
                WHERE "commentId"=$1 AND "status" = $2`;

    const countLike = await this.dataSource.query(query, [commentId, status]);

    return +countLike[0].count;
  }
}
