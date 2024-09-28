import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManagerUseCase } from '../../../../../common/use-cases/transaction.use-case';
import { ResultType } from '../../../../../common/types/result';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsSubscriptionsRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { TelegramMessageModel } from '../../api/models/telegram.input.model';
import { ResultCode } from '../../../../../common/utils';

export class AddTelegramNotificationToBlogSubscriptionCommand {
  constructor(public readonly payload: TelegramMessageModel) {}
}
@CommandHandler(AddTelegramNotificationToBlogSubscriptionCommand)
export class AddTelegramNotificationToBlogSubscriptionUseCase
  extends TransactionManagerUseCase<
    AddTelegramNotificationToBlogSubscriptionCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<AddTelegramNotificationToBlogSubscriptionCommand>
{
  constructor(
    private blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    private blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: AddTelegramNotificationToBlogSubscriptionCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { payload } = command;

    if (
      !payload ||
      !payload.message ||
      !payload.message.from ||
      !payload.message.text
    ) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'Invalid payload data',
        field: 'payload',
      };
    }

    const telegramId = payload.message.from.id;

    let telegramCode = payload.message.text;

    if (telegramCode.startsWith('/start')) {
      telegramCode = telegramCode.split(' ')[1];
    } else {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'Telegram code blog subscription is invalid format',
        field: 'telegramCode',
      };
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getBlogSubscriptionByTelegramCode(
        telegramCode,
        manager,
      );

    if (!subscription) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Blog subscription not found',
      };
    }

    await this.blogsSubscriptionsRepository.addTelegramIdToBlogSubscription(
      subscription.id,
      telegramId,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
