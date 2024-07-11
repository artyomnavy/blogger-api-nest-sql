import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { User } from '../../../users/domain/user.entity';

export class BindBlogWithUserCommand {
  constructor(
    public readonly blogId: string,
    public readonly user: User,
  ) {}
}
@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase
  implements ICommandHandler<BindBlogWithUserCommand>
{
  constructor(private blogsRepository: BlogsRepository) {}
  async execute(command: BindBlogWithUserCommand) {
    return await this.blogsRepository.bindBlogWithUser(
      command.blogId,
      command.user,
    );
  }
}
