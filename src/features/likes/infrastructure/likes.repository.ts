import { Injectable } from '@nestjs/common';
import { LikeModel, LikeOutputModel } from '../api/models/like.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument } from '../domain/like.entity';
import { Model } from 'mongoose';

@Injectable()
export class LikesRepository {
  constructor(@InjectModel(Like.name) private likeModel: Model<LikeDocument>) {}
  async createLike(inputData: LikeModel): Promise<LikeOutputModel> {
    const resultCreateLike = await this.likeModel.create({
      commentIdOrPostId: inputData.commentIdOrPostId,
      userId: inputData.userId,
      status: inputData.status,
      addedAt: inputData.addedAt,
    });

    return {
      commentIdOrPostId: resultCreateLike.commentIdOrPostId,
      userId: resultCreateLike.userId,
      status: resultCreateLike.status,
      addedAt: resultCreateLike.addedAt.toISOString(),
    };
  }
  async deleteLike(
    commentIdOrPostId: string,
    userId: string,
  ): Promise<boolean> {
    const resultDeleteLikeStatus = await this.likeModel.deleteOne({
      commentIdOrPostId: commentIdOrPostId,
      userId: userId,
    });
    return resultDeleteLikeStatus.deletedCount === 1;
  }
  async updateLike(updateData: LikeModel): Promise<boolean> {
    const resultUpdateLikeStatus = await this.likeModel.updateOne(
      {
        commentIdOrPostId: updateData.commentIdOrPostId,
        userId: updateData.userId,
      },
      {
        $set: {
          status: updateData.status,
          addedAt: updateData.addedAt,
        },
      },
    );
    return resultUpdateLikeStatus.matchedCount === 1;
  }
}
