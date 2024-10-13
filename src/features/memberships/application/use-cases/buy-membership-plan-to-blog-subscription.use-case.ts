import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import {
  PaymentsSystems,
  ResultCode,
  SubscriptionStatus,
} from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsSubscriptionsRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { BlogsMembershipsPlansQueryRepository } from '../../infrastructure/blogs-memberships-plans-query-repository';
import { Request } from 'express';
import { PaymentsManager } from '../../../integrations/payments/managers/payments-manager';
import { PaymentsBlogsMembershipsRepository } from '../../../integrations/payments/infrastructure/payments-blogs-memberships-repository';

export class BuyMembershipPlanToBlogSubscriptionCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly membershipPlanId: string,
    public readonly paymentSystem: PaymentsSystems,
    public readonly req: Request,
  ) {}
}
@CommandHandler(BuyMembershipPlanToBlogSubscriptionCommand)
export class BuyMembershipPlanToBlogSubscriptionUseCase
  extends TransactionManagerUseCase<
    BuyMembershipPlanToBlogSubscriptionCommand,
    ResultType<{ url: string } | null>
  >
  implements ICommandHandler<BuyMembershipPlanToBlogSubscriptionCommand>
{
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    private blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    private blogsMembershipsPlansQueryRepository: BlogsMembershipsPlansQueryRepository,
    private paymentsBlogsMembershipsRepository: PaymentsBlogsMembershipsRepository,
    private paymentsManager: PaymentsManager,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: BuyMembershipPlanToBlogSubscriptionCommand,
    manager: EntityManager,
  ): Promise<ResultType<{ url: string } | null>> {
    const { userId, blogId, membershipPlanId, paymentSystem, req } = command;

    // Проверяем существует ли такой тарифный план membership блога
    const blogMembershipPlan =
      await this.blogsMembershipsPlansQueryRepository.getBlogMembershipPlanById(
        membershipPlanId,
        manager,
      );

    if (!blogMembershipPlan) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'Blog membership plan not found',
        field: 'membershipPlanId',
      };
    }

    // Проверяем существует ли пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User is not found',
        field: 'userId',
      };
    }

    // Проверяем существует ли такой блог и значение isMembership (true)
    const blog = await this.blogsQueryRepository.getOrmBlogById(
      blogId,
      manager,
    );

    if (!blog || !blog.isMembership || blogMembershipPlan.blog.id !== blogId) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'Blog not found or blog without membership',
        field: 'blogId',
      };
    }

    // Проверяем является ли пользователь владельцем или уже подписчиком блога
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (isOwnerBlog) {
      return {
        data: null,
        code: ResultCode.BAD_REQUEST,
        message: 'User is owner blog',
        field: 'userId or blogId',
      };
    }

    // Создаем оплату подписки на блог
    const payment = await this.paymentsBlogsMembershipsRepository.createPayment(
      paymentSystem,
      blogMembershipPlan.price,
      manager,
    );

    let subscription =
      await this.blogsSubscriptionsQueryRepository.getSubscriptionToBlog(
        blogId,
        userId,
        manager,
      );

    // Если действие подписки на блог закончилось и статус подписан,
    // то меняем статус на отписан до подтверждения оплаты
    if (
      subscription &&
      subscription.status === SubscriptionStatus.SUBSCRIBED &&
      subscription.expirationAt !== null &&
      subscription.expirationAt > new Date()
    ) {
      await this.blogsSubscriptionsRepository.unsubscribeUserToBlog(
        {
          blogSubscriptionId: subscription.id,
          status: SubscriptionStatus.UNSUBSCRIBED,
        },
        manager,
      );
    }

    // Если нет подписки, то до подтверждения оплаты создаем подписку на блог со статусом None
    if (!subscription) {
      subscription =
        await this.blogsSubscriptionsRepository.subscribeUserToBlog(
          user,
          blog,
          SubscriptionStatus.NONE,
          manager,
        );
    }

    // Добавляем к подписке информацию об оплате и тарифном плане membership
    await this.blogsSubscriptionsRepository.addPlanAndPaymentMembershipToBlogSubscription(
      subscription,
      blogMembershipPlan,
      payment,
      manager,
    );

    // Создаем ссылку на оплату через платежную систему
    const paymentProviderInfo = await this.paymentsManager.createPayment(
      paymentSystem,
      blogMembershipPlan,
      payment.id,
      req,
    );

    // Добавляем информацию платежного провайдера к оплате подписки на блог
    await this.paymentsBlogsMembershipsRepository.addProviderInfoToPaymentBlogMembership(
      payment,
      paymentProviderInfo,
      manager,
    );

    return {
      data: { url: paymentProviderInfo.data.url },
      code: ResultCode.SUCCESS,
    };
  }
}
