import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LikeModel } from '../api/models/like.output.model';
import { Model } from 'mongoose';
import { Like, LikeDocument } from '../domain/like.entity';
import { likesStatuses } from '../../../utils';
import { NewestLikesOutputModel } from '../../posts/api/models/post.output.model';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { ObjectId } from 'mongodb';

@Injectable()
export class LikesQueryRepository {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    protected usersQueryRepository: UsersQueryRepository,
  ) {}
  async getLikeCommentOrPostForUser(
    commentIdOrPostId: string,
    userId: string,
  ): Promise<LikeModel | null> {
    const like = await this.likeModel.findOne({
      commentIdOrPostId: commentIdOrPostId,
      userId: userId,
    });

    if (!like) {
      return null;
    } else {
      return like;
    }
  }
  async getNewestLikesForPost(
    postId: string,
  ): Promise<NewestLikesOutputModel[]> {
    const newestLikes = await this.likeModel
      .find({
        commentIdOrPostId: postId,
        status: likesStatuses.like,
      })
      .sort({ addedAt: 'desc' })
      .limit(3);

    return await Promise.all(newestLikes.map((like) => this.likeMapper(like)));
  }
  async getStatusCount(id: string, status: string): Promise<number> {
    const statusCount = await this.likeModel.countDocuments({
      commentIdOrPostId: id,
      status: status,
    });

    return statusCount;
  }
  async likeMapper(like: LikeModel) {
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
