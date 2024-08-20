import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { UsersBansByBloggersRepository } from '../../infrastructure/users-bans-by-bloggers-repository';
import { UpdateUserBanByBloggerModel } from '../../api/models/ban.input.model';

export class UpdateUserBanInfoByBloggerCommand {
  constructor(
    public readonly blogOwnerId: string,
    public readonly userId: string,
    public readonly updateData: UpdateUserBanByBloggerModel,
  ) {}
}
@CommandHandler(UpdateUserBanInfoByBloggerCommand)
export class UpdateUserBanInfoByBloggerUseCase
  extends TransactionManagerUseCase<
    UpdateUserBanInfoByBloggerCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<UpdateUserBanInfoByBloggerCommand>
{
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersBansByBloggersRepository: UsersBansByBloggersRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: UpdateUserBanInfoByBloggerCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { blogOwnerId, userId, updateData } = command;

    // Устанавливаем значения по умолчанию для даты и причины бана
    let banDate: Date | null = null;
    let banReason: string | null = null;
    let blogId: string | null = null;

    // Проверяем существует ли такой владелец блога
    const ownerBlog = await this.usersQueryRepository.getUserById(
      blogOwnerId,
      manager,
    );

    if (!ownerBlog) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Owner blog not found',
      };
    }

    // Проверяем существует ли такой пользователь для бана/разбана
    const user = await this.usersQueryRepository.getOrmUserByIdWithBanInfo(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    // Проверяем существует ли такой блог
    const blog = await this.blogsQueryRepository.getBlogById(updateData.blogId);

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Blog not found',
      };
    }

    // Проверяем принадлежит ли блог владельцу
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      blogOwnerId,
      updateData.blogId,
    );

    if (!isOwnerBlog) {
      return {
        data: false,
        code: ResultCode.FORBIDDEN,
        message: 'Blog not owned by user',
      };
    }

    // Проверяем статус бана запроса
    if (updateData.isBanned) {
      banDate = new Date();
      banReason = updateData.banReason;
      blogId = updateData.blogId;
    }

    // Обновляем информацию о бане пользователя
    await this.usersBansByBloggersRepository.updateUserBanInfoByBlogger(
      user.userBanByBloggers,
      updateData.isBanned,
      banReason,
      banDate,
      blogId,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
