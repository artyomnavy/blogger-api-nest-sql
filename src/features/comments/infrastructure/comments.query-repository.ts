import { Injectable } from '@nestjs/common';
import {
  CommentModel,
  CommentOutputModel,
} from '../api/models/comment.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Comment, CommentDocument } from '../domain/comment.entity';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { LikesQueryRepository } from '../../likes/infrastructure/likes.query-repository';
import { likesStatuses } from '../../../utils';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    protected likesQueryRepository: LikesQueryRepository,
  ) {}
  async getCommentById(
    commentId: string,
    userId?: string | null,
  ): Promise<CommentOutputModel | null> {
    const comment = await this.commentModel.findOne({
      _id: new ObjectId(commentId),
    });

    if (!comment) {
      return null;
    } else {
      return await this.commentMapper(comment, userId);
    }
  }
  async getCommentsByPostId(
    queryData: { query: PaginatorModel } & { postId: string } & {
      userId?: string | null;
    },
  ): Promise<PaginatorOutputModel<CommentOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? queryData.query.sortDirection
      : 'desc';
    const postId = queryData.postId;
    const userId = queryData.userId;

    const filter = {
      postId: postId,
    };

    const comments = await this.commentModel
      .find(filter)
      .sort({
        [sortBy]: sortDirection === 'desc' ? -1 : 1,
      })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    const totalCount = await this.commentModel.countDocuments(filter);
    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount,
      items: await Promise.all(
        comments.map((comment) => this.commentMapper(comment, userId)),
      ),
    };
  }
  async commentMapper(comment: CommentModel, userId?: string | null) {
    let likeStatus: string | null = null;

    if (userId) {
      const like = await this.likesQueryRepository.getLikeCommentOrPostForUser(
        comment._id.toString(),
        userId,
      );

      if (like) {
        likeStatus = like.status;
      }
    }

    return {
      id: comment._id.toString(),
      content: comment.content,
      commentatorInfo: {
        userId: comment.commentatorInfo.userId,
        userLogin: comment.commentatorInfo.userLogin,
      },
      createdAt: comment.createdAt.toISOString(),
      likesInfo: {
        likesCount: comment.likesInfo.likesCount,
        dislikesCount: comment.likesInfo.dislikesCount,
        myStatus: likeStatus || likesStatuses.none,
      },
    };
  }
}
