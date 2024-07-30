import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { UpdateBlogBanByAdminModel } from '../../api/models/blog.input.model';
import { BlogsBansByAdminRepository } from '../../infrastructure/blogs-bans-by-admin-repository';

export class UpdateBlogBanInfoByAdminCommand {
  constructor(
    public readonly blogId: string,
    public readonly updateData: UpdateBlogBanByAdminModel,
  ) {}
}
@CommandHandler(UpdateBlogBanInfoByAdminCommand)
export class UpdateBlogBanInfoByAdminUseCase
  extends TransactionManagerUseCase<
    UpdateBlogBanInfoByAdminCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<UpdateBlogBanInfoByAdminCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsBansByAdminRepository: BlogsBansByAdminRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: UpdateBlogBanInfoByAdminCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { blogId, updateData } = command;

    // Устанавливаем значение по умолчанию для даты бана
    let banDate: Date | null = null;

    // Проверяем существует ли такой блог
    const blog =
      await this.blogsQueryRepository.getOrmBlogByIdWithBanInfo(blogId);

    if (!blog) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Blog not found',
      };
    }

    // Проверяем статус бана запроса
    if (updateData.isBanned) {
      banDate = new Date();
    }

    // Обновляем информацию о бане пользователя
    await this.blogsBansByAdminRepository.updateBlogBanInfoByAdmin(
      blog.blogBanByAdmin,
      updateData.isBanned,
      banDate,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
