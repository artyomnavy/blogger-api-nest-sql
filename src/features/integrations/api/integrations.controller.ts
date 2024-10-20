import {
  BadRequestException,
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
import process from 'node:process';
import { StripeAdapter } from '../payments/adapters/stripe-adapter';
import { FinishPaymentBlogMembershipCommand } from '../payments/application/use-cases/finish-payment-blog-membership-use.case';
import { ExpiredPaymentBlogMembershipCommand } from '../payments/application/use-cases/expired-payment-blog-membership-use.case';

@Controller('integrations')
export class IntegrationsController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected stripeAdapter: StripeAdapter,
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
    const signature = request.headers['stripe-signature'];
    const rawBody = request.rawBody;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !rawBody || !webhookSecret) {
      throw new BadRequestException(
        'Signature or raw body or stripe webhook secret is missing',
      );
    }

    try {
      const event = this.stripeAdapter.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      let session;

      // Подписка на блог оплачена
      if (event.type === 'checkout.session.completed') {
        session = event.data.object;

        const result = await this.commandBus.execute(
          new FinishPaymentBlogMembershipCommand(
            session.client_reference_id,
            event,
          ),
        );

        if (result.code !== ResultCode.SUCCESS) {
          resultCodeToHttpException(result.code, result.message, result.field);
        }

        return;
      }

      // Время оплаты подписки на блог истекло
      if (event.type === 'checkout.session.expired') {
        session = event.data.object;

        const result = await this.commandBus.execute(
          new ExpiredPaymentBlogMembershipCommand(session.client_reference_id),
        );

        if (result.code !== ResultCode.SUCCESS) {
          resultCodeToHttpException(result.code, result.message, result.field);
        }

        return;
      }
    } catch (err) {
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }
  }

  @Get('stripe/success')
  success(): string {
    return 'Thanks for your subscribe! Check page with your subscription to blog';
  }

  @Get('stripe/cancel')
  cancel(): string {
    return 'Something wrong payment. Check page with your subscription to blog';
  }
}
