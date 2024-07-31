import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatuses, ResultCode } from '../../../../common/utils';
import { v4 as uuidv4 } from 'uuid';
import { LikePost } from '../../../likes/api/models/like-post.output.model';
import { LikesPostsRepository } from '../../../likes/infrastructure/likes-posts.repository';
import { PostsQueryRepository } from '../../infrastructure/posts.query-repository';
import { ResultType } from '../../../../common/types/result';

export class ChangeLikeStatusForPostCommand {
  constructor(
    public readonly userId: string,
    public readonly postId: string,
    public readonly likeStatus: string,
  ) {}
}
@CommandHandler(ChangeLikeStatusForPostCommand)
export class ChangeLikeStatusForPostUseCase
  implements ICommandHandler<ChangeLikeStatusForPostCommand>
{
  constructor(
    private readonly likesPostsRepository: LikesPostsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
  ) {}

  async execute(
    command: ChangeLikeStatusForPostCommand,
  ): Promise<ResultType<boolean>> {
    const { userId, postId, likeStatus } = command;

    const post = await this.postsQueryRepository.getPostByIdForPublic(
      postId,
      userId,
    );

    if (!post) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Post not found',
      };
    }

    const currentMyStatus = post.extendedLikesInfo.myStatus;

    if (command.likeStatus === currentMyStatus) {
      return {
        data: true,
        code: ResultCode.SUCCESS,
      };
    }

    const newLike = new LikePost(
      uuidv4(),
      post.id,
      userId,
      likeStatus,
      new Date(),
    );

    if (currentMyStatus === LikeStatuses.NONE) {
      // Create like for post
      await this.likesPostsRepository.createLikeForPost(newLike);

      return {
        data: true,
        code: ResultCode.SUCCESS,
      };
    } else {
      switch (command.likeStatus) {
        case LikeStatuses.NONE:
          // Delete like for post
          await this.likesPostsRepository.deleteLikeForPost(post.id, userId);

          return {
            data: true,
            code: ResultCode.SUCCESS,
          };
        default:
          // Update like for post
          await this.likesPostsRepository.updateLikeForPost(post.id, userId, {
            status: command.likeStatus,
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
