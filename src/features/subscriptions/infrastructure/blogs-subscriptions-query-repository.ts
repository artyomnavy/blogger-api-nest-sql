import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogSubscription } from '../domain/blog-subscription.entity';

@Injectable()
export class BlogsSubscriptionsQueryRepository {
  constructor(
    @InjectRepository(BlogSubscription)
    private readonly blogsSubscriptionsQueryRepository: Repository<BlogSubscription>,
  ) {}
  async getBlogSubscriptionByUserId(
    userId: string,
  ): Promise<BlogSubscription | null> {
    const blogSubscription = await this.blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('bs.user_id = :userId', { userId: userId })
      .getOne();

    if (!blogSubscription) {
      return null;
    } else {
      return blogSubscription;
    }
  }
  async getBlogSubscriptionByTelegramCode(
    telegramCode: string,
  ): Promise<BlogSubscription | null> {
    const blogSubscription = await this.blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('bs.telegramCode = :telegramCode', { telegramCode: telegramCode })
      .getOne();

    if (!blogSubscription) {
      return null;
    } else {
      return blogSubscription;
    }
  }
}
