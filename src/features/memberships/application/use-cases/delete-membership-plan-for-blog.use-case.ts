import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { HTTP_STATUSES } from '../../../../common/utils';
import { Notice } from '../../../../common/notification/notice';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { BlogsMembershipsPlansRepository } from '../../infrastructure/blogs-memberships-plans-repository';
import { BlogsMembershipsPlansQueryRepository } from '../../infrastructure/blogs-memberships-plans-query-repository';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';

export class DeleteMembershipPlanForBlogCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly planId: string,
  ) {}
}
@CommandHandler(DeleteMembershipPlanForBlogCommand)
export class DeleteMembershipPlanForBlogUseCase
  extends TransactionManagerUseCase<DeleteMembershipPlanForBlogCommand, Notice>
  implements ICommandHandler<DeleteMembershipPlanForBlogCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly blogsMembershipsPlansRepository: BlogsMembershipsPlansRepository,
    private readonly blogsMembershipsPlansQueryRepository: BlogsMembershipsPlansQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: DeleteMembershipPlanForBlogCommand,
    manager: EntityManager,
  ) {
    const notice = new Notice();

    const { userId, blogId, planId } = command;

    // Проверяем существует ли такой тарифный план membership для блога
    const blogMembershipPlan =
      await this.blogsMembershipsPlansQueryRepository.getBlogMembershipPlanById(
        planId,
      );

    if (!blogMembershipPlan || blogMembershipPlan.blog.id !== blogId) {
      notice.addError(
        HTTP_STATUSES.NOT_FOUND_404,
        'Blog membership plan not found',
      );
      return notice;
    }

    const blog = await this.blogsQueryRepository.getOrmBlogById(
      blogId,
      manager,
    );

    if (!blog) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Blog not found');
      return notice;
    }

    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
      manager,
    );

    if (!isOwnerBlog) {
      notice.addError(HTTP_STATUSES.FORBIDDEN_403, 'Blog not owned by user');
      return notice;
    }

    const isDeleted =
      await this.blogsMembershipsPlansRepository.deleteMembershipPlanForBlog(
        planId,
        manager,
      );

    if (isDeleted) {
      notice.addData(null);
    }

    return notice;
  }
}
