import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HTTP_STATUSES } from '../../../../common/utils';
import { JwtBearerAuthGuard } from '../../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../../common/decorators/current-user-id.param.decorator';
import { TelegramBotAuthLinkOutputModel } from './models/telegram.output.model';
import { TelegramMessageModel } from './models/telegram.input.model';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { v4 as uuidv4 } from 'uuid';
import { BlogsSubscriptionsQueryRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import { BlogsSubscriptionsRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-repository';

@Controller('integrations/telegram')
export class TelegramController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    protected blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
  ) {}
  @Get('auth-bot-link')
  @UseGuards(JwtBearerAuthGuard)
  async getAuthBotLink(
    @CurrentUserId() userId: string,
  ): Promise<TelegramBotAuthLinkOutputModel> {
    const telegramCode = uuidv4();

    const user = await this.usersQueryRepository.getOrmUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getBlogSubscriptionByUserId(
        userId,
      );

    if (!subscription) {
      throw new NotFoundException('Blog subscription not found');
    }

    await this.blogsSubscriptionsRepository.addTelegramCodeToBlogSubscription(
      subscription.id,
      telegramCode,
    );

    return {
      link: `${process.env.TELEGRAM_BOT_LINK}?start=${telegramCode}`,
    };
  }
  @Post('webhook')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async webhookForTelegramBotApi(@Body() payload: TelegramMessageModel) {
    const telegramId = payload.message.from.id;

    let telegramCode = payload.message.text;

    if (telegramCode.startsWith('/start')) {
      telegramCode = telegramCode.split(' ')[1];
    } else {
      throw new BadRequestException({
        message: 'Telegram code blog subscription is invalid format',
        field: 'telegramCode',
      });
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getBlogSubscriptionByTelegramCode(
        telegramCode,
      );

    if (!subscription) {
      throw new NotFoundException('Blog subscription not found');
    }

    await this.blogsSubscriptionsRepository.addTelegramIdToBlogSubscription(
      subscription.id,
      telegramId,
    );

    return;
  }
}
