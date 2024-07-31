import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import {
  Comment,
  CommentOutputModel,
} from '../../api/models/comment.output.model';
import { v4 as uuidv4 } from 'uuid';
import { PostsQueryRepository } from '../../../posts/infrastructure/posts.query-repository';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';

export class CreateCommentCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly content: string,
  ) {}
}
@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly postsQueryRepository: PostsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(
    command: CreateCommentCommand,
  ): Promise<ResultType<CommentOutputModel | null>> {
    const { postId, userId, content } = command;

    const post = await this.postsQueryRepository.getPostByIdForPublic(postId);

    if (!post) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'Post not found',
      };
    }

    const user =
      await this.usersQueryRepository.getOrmUserByIdWithBanInfo(userId);

    if (!user) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    if (user.userBanByBloggers && user.userBanByBloggers.isBanned) {
      return {
        data: null,
        code: ResultCode.FORBIDDEN,
        message: 'User is banned for blog',
      };
    }

    const userLogin = user.login;

    const newComment = new Comment(
      uuidv4(),
      content,
      userId,
      new Date(),
      postId,
    );

    const createdComment = await this.commentsRepository.createComment(
      newComment,
      userLogin,
    );

    return {
      data: createdComment,
      code: ResultCode.SUCCESS,
    };
  }
}
