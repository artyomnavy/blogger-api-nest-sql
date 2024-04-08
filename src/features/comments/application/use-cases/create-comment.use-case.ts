import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { Comment } from '../../api/models/comment.output.model';
import { v4 as uuidv4 } from 'uuid';

export class CreateCommentCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly userLogin: string,
    public readonly content: string,
  ) {}
}
@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async execute(command: CreateCommentCommand) {
    const newComment = new Comment(
      uuidv4(),
      command.content,
      command.userId,
      new Date(),
      command.postId,
    );

    const createdComment = await this.commentsRepository.createComment(
      newComment,
      command.userLogin,
    );

    return createdComment;
  }
}
