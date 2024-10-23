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
import { addMonths } from 'date-fns';
import { BlogsSubscriptionsRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-repository';

export class FinishPaymentBlogMembershipCommand {
  constructor(
    public readonly paymentId: string,
    public readonly anyConfirmPaymentSystemData: any,
  ) {}
}
@CommandHandler(FinishPaymentBlogMembershipCommand)
export class FinishPaymentBlogMembershipUseCase
  extends TransactionManagerUseCase<
    FinishPaymentBlogMembershipCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<FinishPaymentBlogMembershipCommand>
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
    command: FinishPaymentBlogMembershipCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { paymentId, anyConfirmPaymentSystemData } = command;

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

    // Устанавливаем дату истечения подписки на блог
    let expirationAt;

    if (
      subscription.expirationAt === null ||
      subscription.expirationAt > new Date()
    ) {
      expirationAt = addMonths(
        new Date(),
        subscription.blogsMembershipsPlans[0].monthsCount,
      );
    } else {
      expirationAt = addMonths(
        subscription.expirationAt,
        subscription.blogsMembershipsPlans[0].monthsCount,
      );
    }

    // Обновляем статус и дату истечения подписки на блог (подписываем) или продлеваем подписку
    await this.blogsSubscriptionsRepository.subscribeOrRenewSubscribeToBlog(
      subscription.id,
      SubscriptionStatuses.SUBSCRIBED,
      expirationAt,
      manager,
    );

    // Обновляем статус оплаты подписки на блог и добавляем информацию от платежной системы
    await this.paymentsBlogsMembershipsRepository.confirmPaymentBlogMembership(
      payment,
      PaymentStatuses.CONFIRMED,
      anyConfirmPaymentSystemData,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
