import { PostCreatedEvent } from '../../domain/events/post-created.event';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TelegramAdapter } from '../../../integrations/telegram/adapters/telegram.adapter';
import { SubscriptionStatus } from '../../../../common/utils';
import { BlogsSubscriptionsQueryRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';

@EventsHandler(PostCreatedEvent)
export class SendTelegramNotificationToBlogSubscribersWhenPostCreatedEventHandler
  implements IEventHandler<PostCreatedEvent>
{
  constructor(
    private readonly blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    private readonly telegramAdapter: TelegramAdapter,
  ) {}

  async handle(event: PostCreatedEvent) {
    const { blogId, blogName } = event;

    const telegramIds =
      await this.blogsSubscriptionsQueryRepository.getTelegramIdsSubscribersForBlog(
        blogId,
        SubscriptionStatus.SUBSCRIBED,
        new Date(),
      );

    if (telegramIds.length === 0) {
      return;
    }

    const text = `New post published for blog ${blogName}`;

    // Отправляем сообщение каждому подписчику
    for (const telegramId of telegramIds) {
      this.telegramAdapter.sendMessage(text, telegramId);
    }
  }
}
