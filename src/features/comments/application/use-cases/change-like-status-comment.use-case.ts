import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentOutputModel } from '../../api/models/comment.output.model';
import { likesStatuses } from '../../../../utils';
import { LikesCommentsRepository } from '../../../likes/infrastructure/likes-comments.repository';
import { LikeComment } from '../../../likes/api/models/like-comment.output.model';
import { v4 as uuidv4 } from 'uuid';

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
  constructor(private readonly likesRepository: LikesCommentsRepository) {}

  async execute(command: ChangeLikeStatusForCommentCommand): Promise<boolean> {
    const currentMyStatus = command.comment.likesInfo.myStatus;

    if (command.likeStatus === currentMyStatus) {
      return true;
    }

    const newLike = new LikeComment(
      uuidv4(),
      command.comment.id,
      command.userId,
      command.likeStatus,
      new Date(),
    );

    if (currentMyStatus === likesStatuses.none) {
      const likeForComment =
        await this.likesRepository.createLikeForComment(newLike);
      return likeForComment ? true : false;
    } else {
      switch (command.likeStatus) {
        case likesStatuses.none:
          const isDeleteLikeForComment =
            await this.likesRepository.deleteLikeForComment(
              command.comment.id,
              command.userId,
            );
          return isDeleteLikeForComment;

        default:
          const isUpdateLikeForComment =
            await this.likesRepository.updateLikeForComment(
              command.comment.id,
              command.userId,
              {
                status: command.likeStatus,
                addedAt: new Date(),
              },
            );
          return isUpdateLikeForComment;
      }
    }
  }
}
