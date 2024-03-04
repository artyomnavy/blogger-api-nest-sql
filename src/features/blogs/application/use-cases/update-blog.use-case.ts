import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateAndUpdateBlogModel } from '../../api/models/blog.input.model';

export class UpdateBlogCommand {
  constructor(
    public readonly id: string,
    public readonly updateData: CreateAndUpdateBlogModel,
  ) {}
}
@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(command: UpdateBlogCommand) {
    return await this.blogsRepository.updateBlog(
      command.id,
      command.updateData,
    );
  }
}
