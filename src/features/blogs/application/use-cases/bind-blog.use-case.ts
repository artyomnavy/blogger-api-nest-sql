import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { ResultCode } from '../../../../common/utils';

import { ResultType } from '../../../../common/types/result';

export class BindBlogWithUserCommand {
  constructor(
    public readonly blogId: string,
    public readonly userId: string,
  ) {}
}
@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase
  implements ICommandHandler<BindBlogWithUserCommand>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private usersQueryRepository: UsersQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}
  async execute(
    command: BindBlogWithUserCommand,
  ): Promise<ResultType<boolean>> {
    const { blogId, userId } = command;

    const user = await this.usersQueryRepository.getOrmUserById(userId);

    if (!user) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'User is not exist',
        field: 'userId',
      };
    }

    const isBindBlog: boolean = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (isBindBlog) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'Blog is not exist or blog have an owner',
        field: 'blogId',
      };
    }

    await this.blogsRepository.bindBlogWithUser(blogId, user);

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
