import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManagerUseCase } from '../../../../../common/use-cases/transaction.use-case';
import { ResultType } from '../../../../../common/types/result';
import { DataSource, EntityManager } from 'typeorm';
import {
  PaymentStatuses,
  ResultCode,
  SubscriptionStatuses,
} from '../../../../../common/utils';
import { PaymentsBlogsMembershipsQueryRepository } from '../../infrastructure/payments-blogs-memberships-query-repository';
import { PaymentsBlogsMembershipsRepository } from '../../infrastructure/payments-blogs-memberships-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { BlogsSubscriptionsRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-repository';

export class ExpiredPaymentBlogMembershipCommand {
  constructor(public readonly paymentId: string) {}
}
@CommandHandler(ExpiredPaymentBlogMembershipCommand)
export class ExpiredPaymentBlogMembershipUseCase
  extends TransactionManagerUseCase<
    ExpiredPaymentBlogMembershipCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<ExpiredPaymentBlogMembershipCommand>
{
  constructor(
    private paymentsBlogsMembershipsQueryRepository: PaymentsBlogsMembershipsQueryRepository,
    private paymentsBlogsMembershipsRepository: PaymentsBlogsMembershipsRepository,
    private blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    private blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: ExpiredPaymentBlogMembershipCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { paymentId } = command;

    // Проверяем существует ли такая оплата подписки на блог
    const payment =
      await this.paymentsBlogsMembershipsQueryRepository.getPaymentBlogMembershipById(
        paymentId,
        manager,
      );

    if (!payment) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Payment blog membership not found',
        field: 'paymentBlogMembershipId',
      };
    }

    if (payment.status === PaymentStatuses.CONFIRMED) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'Payment blog membership is confirmed',
        field: 'paymentBlogMembershipId',
      };
    }

    // Проверяем по id оплаты существует ли подписка на блог
    const subscription =
      await this.blogsSubscriptionsQueryRepository.getSubscriptionWithMembershipPlanByPaymentId(
        paymentId,
        manager,
      );

    if (!subscription) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Blog subscription by payment blog membership not found',
        field: 'paymentBlogMembershipId',
      };
    }

    // Если статус подписки на блог равен None - удаляем подписку, так как не подтверждена оплата (истекла)
    if (subscription.status === SubscriptionStatuses.NONE) {
      await this.blogsSubscriptionsRepository.deleteBlogSubscriptionById(
        subscription.id,
        manager,
      );
    }

    // Меняем статус оплаты на expired
    await this.paymentsBlogsMembershipsRepository.updateStatusToPaymentBlogMembership(
      paymentId,
      PaymentStatuses.EXPIRED,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
