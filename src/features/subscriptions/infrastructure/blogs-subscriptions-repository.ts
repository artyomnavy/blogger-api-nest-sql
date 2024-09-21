import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogSubscription } from '../domain/blog-subscription.entity';
import { SubscriptionStatus } from '../../../common/utils';
import { User } from '../../users/domain/user.entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { Post } from '../../posts/domain/post.entity';

@Injectable()
export class BlogsSubscriptionsRepository {
  constructor(
    @InjectRepository(BlogSubscription)
    private readonly blogsSubscriptionsRepository: Repository<BlogSubscription>,
  ) {}
  async subscribeUserToBlog(
    user: User,
    blog: Blog,
    manager?: EntityManager,
  ): Promise<BlogSubscription> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const blogSubscription = BlogSubscription.create(user, blog);

    return await blogsSubscriptionsRepository.save(blogSubscription);
  }
  async unsubscribeUserToBlog(
    updateData: {
      blogSubscriptionId: string;
      status: SubscriptionStatus;
      blog: null;
    },
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultUpdateBlogSubscription = await blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        status: updateData.status,
        blog: updateData.blog,
      })
      .where('id = :id', { id: updateData.blogSubscriptionId })
      .execute();

    return resultUpdateBlogSubscription.affected === 1;
  }
  async addTelegramCodeToBlogSubscription(
    subscriptionId: string,
    telegramCode: string,
  ): Promise<boolean> {
    const resultUpdateSubscription = await this.blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        telegramCode: telegramCode,
      })
      .where('id = :id', { id: subscriptionId })
      .execute();

    return resultUpdateSubscription.affected === 1;
  }
  async addTelegramIdToBlogSubscription(
    subscriptionId: string,
    telegramId: number,
  ): Promise<boolean> {
    const resultUpdateSubscription = await this.blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        telegramId: telegramId,
      })
      .where('id = :id', { id: subscriptionId })
      .execute();

    return resultUpdateSubscription.affected === 1;
  }
}
