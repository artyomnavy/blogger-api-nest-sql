import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { PostOutputModel } from '../../api/models/post.output.model';
import { likesStatuses } from '../../../../utils';
import { LikesRepository } from '../../../likes/infrastructure/likes.repository';

export class ChangeLikeStatusForPostCommand {
  constructor(
    public readonly userId: string,
    public readonly post: PostOutputModel,
    public readonly likeStatus: string,
  ) {}
}
@CommandHandler(ChangeLikeStatusForPostCommand)
export class ChangeLikeStatusForPostUseCase
  implements ICommandHandler<ChangeLikeStatusForPostCommand>
{
  constructor(
    private readonly postsRepository: PostsRepository,
    private readonly likesRepository: LikesRepository,
  ) {}

  async execute(command: ChangeLikeStatusForPostCommand): Promise<boolean> {
    const currentMyStatus = command.post.extendedLikesInfo.myStatus;
    let likesCount = command.post.extendedLikesInfo.likesCount;
    let dislikesCount = command.post.extendedLikesInfo.dislikesCount;

    if (command.likeStatus === currentMyStatus) {
      return true;
    }

    const newLike = {
      commentIdOrPostId: command.post.id,
      userId: command.userId,
      status: command.likeStatus,
      addedAt: new Date(),
    };

    if (currentMyStatus === likesStatuses.none) {
      await this.likesRepository.createLike(newLike);
    } else if (command.likeStatus === likesStatuses.none) {
      await this.likesRepository.deleteLike(command.post.id, command.userId);
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

    return await this.postsRepository.changeLikeStatusPostForUser(
      command.post.id,
      likesCount,
      dislikesCount,
    );
  }
}
