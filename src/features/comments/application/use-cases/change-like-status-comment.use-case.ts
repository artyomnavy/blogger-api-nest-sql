import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentOutputModel } from '../../api/models/comment.output.model';
import { likesStatuses } from '../../../../utils';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';

export class ChangeLikeStatusForCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly comment: CommentOutputModel,
    public readonly likeStatus: string,
  ) {}
}
@CommandHandler(ChangeLikeStatusForCommentCommand)
export class ChangeLikeStatusForCommentUseCase
  implements ICommandHandler<ChangeLikeStatusForCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly likesRepository: LikesRepository,
  ) {}

  async execute(command: ChangeLikeStatusForCommentCommand): Promise<boolean> {
    const currentMyStatus = command.comment.likesInfo.myStatus;
    let likesCount = command.comment.likesInfo.likesCount;
    let dislikesCount = command.comment.likesInfo.dislikesCount;

    if (command.likeStatus === currentMyStatus) {
      return true;
    }

    const newLike = {
      commentIdOrPostId: command.comment.id,
      userId: command.userId,
      status: command.likeStatus,
      addedAt: new Date(),
    };

    if (currentMyStatus === likesStatuses.none) {
      await this.likesRepository.createLike(newLike);
    } else if (command.likeStatus === likesStatuses.none) {
      await this.likesRepository.deleteLike(command.comment.id, command.userId);
    } else {
      await this.likesRepository.updateLike(newLike);
    }

    if (
      command.likeStatus === likesStatuses.none &&
      currentMyStatus === likesStatuses.like
    ) {
      likesCount--;
    }

    if (
      command.likeStatus === likesStatuses.like &&
      currentMyStatus === likesStatuses.none
    ) {
      likesCount++;
    }

    if (
      command.likeStatus === likesStatuses.none &&
      currentMyStatus === likesStatuses.dislike
    ) {
      dislikesCount--;
    }

    if (
      command.likeStatus === likesStatuses.dislike &&
      currentMyStatus === likesStatuses.none
    ) {
      dislikesCount++;
    }

    if (
      command.likeStatus === likesStatuses.like &&
      currentMyStatus === likesStatuses.dislike
    ) {
      likesCount++;
      dislikesCount--;
    }

    if (
      command.likeStatus === likesStatuses.dislike &&
      currentMyStatus === likesStatuses.like
    ) {
      likesCount--;
      dislikesCount++;
    }

    return await this.commentsRepository.changeLikeStatusCommentForUser(
      command.comment.id,
      likesCount,
      dislikesCount,
    );
  }
}
