import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { TelegramBotAuthLinkOutputModel } from '../telegram/api/models/telegram.output.model';
import { TelegramMessageModel } from '../telegram/api/models/telegram.input.model';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { GenerateAuthBotLinkCommand } from '../telegram/application/use-cases/generate-auth-bot-link.use-case';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { AddTelegramNotificationToBlogSubscriptionCommand } from '../telegram/application/use-cases/add-telegram-notification-to-blog-subscription.use-case';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('telegram/auth-bot-link')
  @UseGuards(JwtBearerAuthGuard)
  async getAuthBotLink(
    @CurrentUserId() userId: string,
  ): Promise<TelegramBotAuthLinkOutputModel | null> {
    const result = await this.commandBus.execute(
      new GenerateAuthBotLinkCommand(userId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return result.data;
  }

  @Post('telegram/webhook')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async webhookForTelegramBotApi(@Body() payload: TelegramMessageModel) {
    const result = await this.commandBus.execute(
      new AddTelegramNotificationToBlogSubscriptionCommand(payload),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return;
  }

  @Post('stripe/webhook')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async webhookForStripeApi(@Req() request: RawBodyRequest<Request>) {
    // TO DO: write logic webhook (session stripe) and finish payment

    return;
  }
}
