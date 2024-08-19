import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../infrastructure/blogs.query-repository';
import { ResultCode } from '../../../../common/utils';

import { ResultType } from '../../../../common/types/result';
import { v4 as uuidv4 } from 'uuid';
import { BlogsBansByAdminRepository } from '../../../bans/infrastructure/blogs-bans-by-admin-repository';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { BlogBanInfoByAdmin } from '../../../bans/api/models/ban.output.model';

export class BindBlogWithUserCommand {
  constructor(
    public readonly blogId: string,
    public readonly userId: string,
  ) {}
}
@CommandHandler(BindBlogWithUserCommand)
export class BindBlogWithUserUseCase
  extends TransactionManagerUseCase<
    BindBlogWithUserCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<BindBlogWithUserCommand>
{
  constructor(
    private blogsRepository: BlogsRepository,
    private usersQueryRepository: UsersQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private blogsBansByAdminRepository: BlogsBansByAdminRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: BindBlogWithUserCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { blogId, userId } = command;

    // Проверяем существует ли пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'User is not exist',
        field: 'userId',
      };
    }

    // Проверяем существует ли блог и есть ли у него владелец
    const isBindBlog: boolean = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
      manager,
    );

    if (isBindBlog) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'Blog is not exist or blog have an owner',
        field: 'blogId',
      };
    }

    // Создаем информацию о бане блога
    const newBlogBanInfoByAdmin = new BlogBanInfoByAdmin(uuidv4(), false, null);

    const blogBanByAdmin =
      await this.blogsBansByAdminRepository.createBlogBanInfoByAdmin(
        newBlogBanInfoByAdmin,
        manager,
      );

    // Привязываем блог к пользователю
    await this.blogsRepository.bindBlogWithUser(
      blogId,
      user,
      blogBanByAdmin,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
