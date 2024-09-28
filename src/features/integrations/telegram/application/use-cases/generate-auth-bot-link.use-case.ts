import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TransactionManagerUseCase } from '../../../../../common/use-cases/transaction.use-case';
import { ResultType } from '../../../../../common/types/result';
import { v4 as uuidv4 } from 'uuid';
import { TelegramBotAuthLinkOutputModel } from '../../api/models/telegram.output.model';
import { DataSource, EntityManager } from 'typeorm';
import { UsersQueryRepository } from '../../../../users/infrastructure/users.query-repository';
import { BlogsSubscriptionsRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { ResultCode } from '../../../../../common/utils';

export class GenerateAuthBotLinkCommand {
  constructor(public readonly userId: string) {}
}
@CommandHandler(GenerateAuthBotLinkCommand)
export class GenerateAuthBotLinkUseCase
  extends TransactionManagerUseCase<
    GenerateAuthBotLinkCommand,
    ResultType<TelegramBotAuthLinkOutputModel | null>
  >
  implements ICommandHandler<GenerateAuthBotLinkCommand>
{
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    private blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: GenerateAuthBotLinkCommand,
    manager: EntityManager,
  ): Promise<ResultType<TelegramBotAuthLinkOutputModel | null>> {
    const { userId } = command;

    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getBlogSubscriptionByUserId(
        userId,
        manager,
      );

    if (!subscription) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'Blog subscription not found',
      };
    }

    if (
      subscription.telegramCode !== null &&
      subscription.telegramId !== null
    ) {
      return {
        data: null,
        code: ResultCode.BAD_REQUEST,
        message: 'Subscriber telegramCode or telegramId is empty',
        field: 'telegramCode or telegramId',
      };
    }

    const telegramCode = uuidv4();

    await this.blogsSubscriptionsRepository.addTelegramCodeToBlogSubscription(
      subscription.id,
      telegramCode,
      manager,
    );

    return {
      data: {
        link: `${process.env.TELEGRAM_BOT_LINK}?start=${telegramCode}`,
      },
      code: ResultCode.SUCCESS,
    };
  }
}
