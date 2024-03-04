import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { CreateAndUpdateCommentModel } from '../../api/models/comment.input.model';

export class UpdateCommentCommand {
  constructor(
    public readonly commentId: string,
    public readonly updateData: CreateAndUpdateCommentModel,
  ) {}
}
@CommandHandler(UpdateCommentCommand)
export class UpdateCommentUseCase
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: UpdateCommentCommand): Promise<boolean> {
    return await this.commentsRepository.updateComment(
      command.commentId,
      command.updateData,
    );
  }
}
