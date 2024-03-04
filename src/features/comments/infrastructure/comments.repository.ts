import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { CreateAndUpdateCommentModel } from '../api/models/comment.input.model';
import { CommentsQueryRepository } from './comments.query-repository';

@Injectable()
export class CommentsRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    protected commentsQueryRepository: CommentsQueryRepository,
  ) {}
  async createComment(newComment: CommentModel): Promise<CommentOutputModel> {
    const resultCreateComment = await this.commentModel.create(newComment);
    return await this.commentsQueryRepository.commentMapper(
      resultCreateComment,
    );
  }
  async updateComment(
    id: string,
    updateData: CreateAndUpdateCommentModel,
  ): Promise<boolean> {
    const resultUpdateComment = await this.commentModel.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          content: updateData.content,
        },
      },
    );
    return resultUpdateComment.matchedCount === 1;
  }
  async changeLikeStatusCommentForUser(
    commentId: string,
    likesCount: number,
    dislikesCount: number,
  ): Promise<boolean> {
    const resultUpdateLikeStatus = await this.commentModel.updateOne(
      {
        _id: new ObjectId(commentId),
      },
      {
        $set: {
          'likesInfo.likesCount': likesCount,
          'likesInfo.dislikesCount': dislikesCount,
        },
      },
    );
    return resultUpdateLikeStatus.matchedCount === 1;
  }
  async deleteComment(id: string): Promise<boolean> {
    const resultDeleteComment = await this.commentModel.deleteOne({
      _id: new ObjectId(id),
    });
    return resultDeleteComment.deletedCount === 1;
  }
}
