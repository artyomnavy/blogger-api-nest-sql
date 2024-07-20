import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CreateAndUpdateCommentModel } from '../../api/models/comment.input.model';
import { CommentsQueryRepository } from '../../infrastructure/comments.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';

export class UpdateCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly commentId: string,
    public readonly updateData: CreateAndUpdateCommentModel,
  ) {}
}
@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly commentsQueryRepository: CommentsQueryRepository,
  ) {}

  async execute(command: UpdateCommentCommand): Promise<ResultType<boolean>> {
    const { userId, commentId, updateData } = command;

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

    await this.commentsRepository.updateComment(commentId, updateData);

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
