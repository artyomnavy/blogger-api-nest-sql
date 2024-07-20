import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CommentsQueryRepository } from '../../infrastructure/comments.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';

export class DeleteCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
  ) {}
}
@CommandHandler(DeleteCommentCommand)
export class DeleteCommentUseCase
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(command: DeleteCommentCommand): Promise<ResultType<boolean>> {
    const { commentId, userId } = command;

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
    } else if (comment.commentatorInfo.userId !== userId) {
      return {
        data: false,
        code: ResultCode.FORBIDDEN,
        message: 'Comment is not yours',
      };
    }

    await this.commentsRepository.deleteComment(commentId);

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
