import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatuses, ResultCode } from '../../../../common/utils';
import { LikesCommentsRepository } from '../../infrastructure/likes-comments.repository';
import { LikeComment } from '../../api/models/like-comment.output.model';
import { v4 as uuidv4 } from 'uuid';
import { CommentsQueryRepository } from '../../../comments/infrastructure/comments.query-repository';
import { ResultType } from '../../../../common/types/result';

export class ChangeLikeStatusForCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
    public readonly likeStatus: string,
  ) {}
}
@CommandHandler(ChangeLikeStatusForCommentCommand)
export class ChangeLikeStatusForCommentUseCase
  implements ICommandHandler<ChangeLikeStatusForCommentCommand>
{
  constructor(
    private readonly likesRepository: LikesCommentsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(
    command: ChangeLikeStatusForCommentCommand,
  ): Promise<ResultType<boolean>> {
    const { userId, commentId, likeStatus } = command;

    const comment = await this.commentsQueryRepository.getCommentById(
      commentId,
      userId,
    );

    if (!comment) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Comment not found',
      };
    }

    const currentMyStatus = comment.likesInfo.myStatus;

    if (command.likeStatus === currentMyStatus) {
      return {
        data: true,
        code: ResultCode.SUCCESS,
      };
    }

    const newLike = new LikeComment(
      uuidv4(),
      comment.id,
      userId,
      likeStatus,
      new Date(),
    );

    if (currentMyStatus === LikeStatuses.NONE) {
      // Create like for comment
      await this.likesRepository.createLikeForComment(newLike);

      return {
        data: true,
        code: ResultCode.SUCCESS,
      };
    } else {
      switch (likeStatus) {
        case LikeStatuses.NONE:
          // Delete like for comment
          await this.likesRepository.deleteLikeForComment(comment.id, userId);

          return {
            data: true,
            code: ResultCode.SUCCESS,
          };

        default:
          // Update like for comment
          await this.likesRepository.updateLikeForComment(comment.id, userId, {
            status: likeStatus,
            addedAt: new Date(),
          });

          return {
            data: true,
            code: ResultCode.SUCCESS,
          };
      }
    }
  }
}
