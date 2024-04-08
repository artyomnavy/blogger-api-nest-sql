import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostOutputModel } from '../../api/models/post.output.model';
import { likesStatuses } from '../../../../utils';
import { v4 as uuidv4 } from 'uuid';
import { LikePost } from '../../../likes/api/models/like-post.output.model';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';

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
  constructor(private readonly likesPostsRepository: LikesPostsRepository) {}

  async execute(command: ChangeLikeStatusForPostCommand): Promise<boolean> {
    const currentMyStatus = command.post.extendedLikesInfo.myStatus;

    if (command.likeStatus === currentMyStatus) {
      return true;
    }

    const newLike = new LikePost(
      uuidv4(),
      command.post.id,
      command.userId,
      command.likeStatus,
      new Date(),
    );

    if (currentMyStatus === likesStatuses.none) {
      const likeForPost =
        await this.likesPostsRepository.createLikeForPost(newLike);
      return likeForPost ? true : false;
    } else {
      switch (command.likeStatus) {
        case likesStatuses.none:
          const isDeleteLikeForPost =
            await this.likesPostsRepository.deleteLikeForPost(
              command.post.id,
              command.userId,
            );
          return isDeleteLikeForPost;
        default:
          const isUpdateLikeForPost =
            await this.likesPostsRepository.updateLikeForPost(
              command.post.id,
              command.userId,
              {
                status: command.likeStatus,
                addedAt: new Date(),
              },
            );
          return isUpdateLikeForPost;
      }
    }
  }
}
