import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HTTP_STATUSES, ResultCode } from '../../../../common/utils';
import { JwtBearerAuthGuard } from '../../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../../common/decorators/current-user-id.param.decorator';
import { TelegramBotAuthLinkOutputModel } from './models/telegram.output.model';
import { TelegramMessageModel } from './models/telegram.input.model';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { BlogsSubscriptionsRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-repository';
import { CommandBus } from '@nestjs/cqrs';
import { GenerateAuthBotLinkCommand } from '../application/use-cases/generate-auth-bot-link.use-case';
import { resultCodeToHttpException } from '../../../../common/exceptions/result-code-to-http-exception';
import { AddTelegramNotificationToBlogSubscriptionCommand } from '../application/use-cases/add-telegram-notification-to-blog-subscription.use-case';

@Controller('integrations/telegram')
export class TelegramController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    protected blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('auth-bot-link')
  @UseGuards(JwtBearerAuthGuard)
  async getAuthBotLink(
    @CurrentUserId() userId: string,
  ): Promise<TelegramBotAuthLinkOutputModel | null> {
    const result = await this.commandBus.execute(
      new GenerateAuthBotLinkCommand(userId),
    );

    if (result.const !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return result.data;
  }

  @Post('webhook')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async webhookForTelegramBotApi(@Body() payload: TelegramMessageModel) {
    const result = await this.commandBus.execute(
      new AddTelegramNotificationToBlogSubscriptionCommand(payload),
    );

    if (result.const !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return;
  }
}
