import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsRepository } from '../../infrastructure/posts.repository';
import { CreateAndUpdatePostModel } from '../../api/models/post.input.model';
import { Post } from '../../api/models/post.output.model';
import { v4 as uuidv4 } from 'uuid';

export class CreatePostCommand {
  constructor(
    public readonly blogId: string,
    public readonly blogName: string,
    public readonly createData: CreateAndUpdatePostModel,
  ) {}
}
@CommandHandler(CreatePostCommand)
export class CreatePostUseCase implements ICommandHandler<CreatePostCommand> {
  constructor(private readonly postsRepository: PostsRepository) {}

  async execute(command: CreatePostCommand) {
    const newPost = new Post(
      uuidv4(),
      command.createData.title,
      command.createData.shortDescription,
      command.createData.content,
      command.blogId,
      new Date(),
    );

    const createdPost = await this.postsRepository.createPost(
      newPost,
      command.blogName,
    );

    return createdPost;
  }
}
