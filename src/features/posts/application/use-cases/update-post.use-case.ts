import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreateAndUpdatePostModel } from '../../api/models/post.input.model';

export class UpdatePostCommand {
  constructor(
    public readonly postId: string,
    public readonly updateData: CreateAndUpdatePostModel,
  ) {}
}
@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    return await this.postsRepository.updatePost(
      command.postId,
      command.updateData,
    );
  }
}
