import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HTTP_STATUSES } from '../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { BlogsRepository } from '../../../blogs/infrastructure/blogs.repository';
import { Notice } from '../../../../common/notification/notice';

export class UpdateBlogMembershipCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly isMembership: boolean,
  ) {}
}
@CommandHandler(UpdateBlogMembershipCommand)
export class UpdateBlogMembershipUseCase
  extends TransactionManagerUseCase<
    UpdateBlogMembershipCommand,
    Notice | undefined
  >
  implements ICommandHandler<UpdateBlogMembershipCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsRepository: BlogsRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(command: UpdateBlogMembershipCommand, manager: EntityManager) {
    const notice = new Notice();

    const { userId, blogId, isMembership } = command;

    // Проверяем существует ли пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'User not found');
      return notice;
    }

    // Проверяем существует ли такой блог
    const blog = await this.blogsQueryRepository.getOrmBlogById(blogId);

    if (!blog) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Blog not found');
      return notice;
    }

    // Проверяем отличается ли значение isMembership
    if (blog.isMembership === isMembership) {
      return notice;
    }

    // Проверяем является ли пользователь владельцем блога
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      notice.addError(HTTP_STATUSES.FORBIDDEN_403, 'Blog not owned by user');
      return notice;
    }

    // Обновляем isMembership блога
    const isUpdated = await this.blogsRepository.updateBlogMembership(
      blogId,
      isMembership,
      manager,
    );

    if (isUpdated) return notice;
  }
}
