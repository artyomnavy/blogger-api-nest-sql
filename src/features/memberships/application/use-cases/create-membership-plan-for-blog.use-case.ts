import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { Notice } from '../../../../common/notification/notice';
import { HTTP_STATUSES, MembershipsPlans } from '../../../../common/utils';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { CreateBlogMembershipPlanModel } from '../../api/models/membership.input.model';
import { BlogsMembershipsPlansQueryRepository } from '../../infrastructure/blogs-memberships-plans-query-repository';
import {
  BlogMembershipPlanOutputModel,
  MembershipPlanForBlog,
} from '../../api/models/membership.output.model';
import { BlogsMembershipsPlansRepository } from '../../infrastructure/blogs-memberships-plans-repository';

export class CreateMembershipPlanForBlogCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly createData: CreateBlogMembershipPlanModel,
  ) {}
}
@CommandHandler(CreateMembershipPlanForBlogCommand)
export class CreateMembershipPlanForBlogUseCase
  extends TransactionManagerUseCase<
    CreateMembershipPlanForBlogCommand,
    Notice<BlogMembershipPlanOutputModel>
  >
  implements ICommandHandler<CreateMembershipPlanForBlogCommand>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly blogsMembershipsPlansRepository: BlogsMembershipsPlansRepository,
    private readonly blogsMembershipsPlansQueryRepository: BlogsMembershipsPlansQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: CreateMembershipPlanForBlogCommand,
    manager: EntityManager,
  ): Promise<Notice<BlogMembershipPlanOutputModel>> {
    const notice = new Notice<BlogMembershipPlanOutputModel>();

    const { userId, blogId, createData } = command;

    // Проверяем существует ли такой пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'User not found');
      return notice;
    }

    // Проверяем существует ли такой блог и значение isMembership (true)
    const blog = await this.blogsQueryRepository.getOrmBlogById(
      blogId,
      manager,
    );

    if (!blog) {
      notice.addError(HTTP_STATUSES.NOT_FOUND_404, 'Blog not found');
      return notice;
    }

    // Проверяем существует ли такой тарифный план membership блога
    const blogMembershipPlan =
      await this.blogsMembershipsPlansQueryRepository.getMembershipPlanByNameForBlog(
        blogId,
        createData.planName,
        manager,
      );

    if (blogMembershipPlan) {
      notice.addError(
        HTTP_STATUSES.BAD_REQUEST_400,
        'Blog membership plan is exist',
      );
      return notice;
    }

    let monthsCount: number;

    switch (createData.planName) {
      case MembershipsPlans.ANNUAL:
        monthsCount = 12;
        break;
      case MembershipsPlans.SEMI_ANNUAL:
        monthsCount = 6;
        break;
      case MembershipsPlans.QUARTERLY:
        monthsCount = 3;
        break;
      default:
        monthsCount = 1;
    }

    // Создаем блог с пользователем и информацией о бане
    const newMembershipPlanForBlog = new MembershipPlanForBlog(
      uuidv4(),
      createData.planName,
      monthsCount,
      createData.price,
      createData.currency,
    );

    const createMembershipPlanForBlog =
      await this.blogsMembershipsPlansRepository.createMembershipPlanForBlog(
        newMembershipPlanForBlog,
        blog,
        manager,
      );

    notice.addData(createMembershipPlanForBlog);

    return notice;
  }
}
