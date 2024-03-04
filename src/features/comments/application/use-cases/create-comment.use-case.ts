import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentsRepository } from '../../infrastructure/comments.repository';
import { Comment } from '../../api/models/comment.output.model';
import { ObjectId } from 'mongodb';
import { likesStatuses } from '../../../../utils';

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
      new ObjectId(),
      command.content,
      {
        userId: command.userId,
        userLogin: command.userLogin,
      },
      new Date(),
      command.postId,
      {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: likesStatuses.none,
      },
    );

    const createdComment =
      await this.commentsRepository.createComment(newComment);

    return createdComment;
  }
}
