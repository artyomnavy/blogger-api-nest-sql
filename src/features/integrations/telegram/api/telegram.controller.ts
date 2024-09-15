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

@Controller('integrations/telegram')
export class TelegramController {
  constructor(protected usersQueryRepository: UsersQueryRepository) {}
  @Get('auth-bot-link')
  @UseGuards(JwtBearerAuthGuard)
  async getAuthBotLink(
    @CurrentUserId() userId: string,
  ): Promise<TelegramBotAuthLinkOutputModel> {
    const telegramCodeSubscriber = uuidv4();

    const user = await this.usersQueryRepository.getOrmUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    //TO DO: write logic after add subscriber entity
    // check subscriber and add telegram code

    return {
      link: `${process.env.TELEGRAM_BOT_LINK}?start=${telegramCodeSubscriber}`,
    };
  }
  @Post('webhook')
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  webhookForTelegramBotApi(@Body() payload: TelegramMessageModel) {
    const telegramId = payload.message.from.id;

    let telegramCodeSubscriber = payload.message.text;

    if (telegramCodeSubscriber.startsWith('/start')) {
      telegramCodeSubscriber = telegramCodeSubscriber.split(' ')[1];
    } else {
      throw new BadRequestException({
        message: 'Telegram code subscriber is invalid format',
        field: 'telegramCode',
      });
    }

    //TO DO: write logic after add subscriber entity
    // check telegram code and add telegramId to subscriber

    return { status: 'success' };
  }
}
