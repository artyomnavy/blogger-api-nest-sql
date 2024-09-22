import { PostCreatedEvent } from '../../domain/events/post-created.event';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { TelegramAdapter } from '../../../integrations/telegram/adapters/telegram.adapter';

@EventsHandler(PostCreatedEvent)
export class SendTelegramNotificationToBlogSubscribersWhenPostCreatedEventHandler
  implements IEventHandler<PostCreatedEvent>
{
  constructor(
    private readonly blogsQueryRepository: BlogsQueryRepository,
    private readonly telegramAdapter: TelegramAdapter,
  ) {}

  async handle(event: PostCreatedEvent) {
    const { blogId, blogName } = event;

    const blogWithSubscribers =
      await this.blogsQueryRepository.getSubscribersForBlog(blogId);

    // Проверяем существует ли блог и не пуст ли массив подписок
    if (
      !blogWithSubscribers ||
      !blogWithSubscribers.blogsSubscriptions ||
      blogWithSubscribers.blogsSubscriptions.length === 0
    ) {
      return;
    }

    // Получаем все telegramId из подписок
    const telegramIds = blogWithSubscribers.blogsSubscriptions.map(
      (subscription) => subscription.telegramId,
    );

    const text = `New post published for blog ${blogName}`;

    // Отправляем сообщение каждому подписчику
    for (const telegramId of telegramIds) {
      this.telegramAdapter.sendMessage(text, telegramId!);
    }
  }
}
