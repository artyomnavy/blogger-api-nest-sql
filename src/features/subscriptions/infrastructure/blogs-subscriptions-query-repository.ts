import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogSubscription } from '../domain/blog-subscription.entity';
import { SubscriptionStatus } from '../../../common/utils';

@Injectable()
export class BlogsSubscriptionsQueryRepository {
  constructor(
    @InjectRepository(BlogSubscription)
    private readonly blogsSubscriptionsQueryRepository: Repository<BlogSubscription>,
  ) {}
  async getBlogSubscriptionByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<BlogSubscription | null> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const blogSubscription = await blogsSubscriptionsQueryRepository
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
    manager?: EntityManager,
  ): Promise<BlogSubscription | null> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const blogSubscription = await blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('bs.telegramCode = :telegramCode', { telegramCode: telegramCode })
      .getOne();

    if (!blogSubscription) {
      return null;
    } else {
      return blogSubscription;
    }
  }
  async getSubscriberToBlog(
    blogId: string,
    userId: string,
    status: SubscriptionStatus,
    manager?: EntityManager,
  ): Promise<BlogSubscription | null> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const subscriber = await blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('(bs.blog_id = :blogId)', { blogId: blogId })
      .andWhere('(bs.user_id = :userId)', { userId: userId })
      .andWhere('(bs.status = :status)', { status: status })
      .getOne();

    if (!subscriber) {
      return null;
    } else {
      return subscriber;
    }
  }
  async getSubscriptionToBlog(
    blogId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<BlogSubscription | null> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const subscription = await blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('(bs.blog_id = :blogId)', { blogId: blogId })
      .andWhere('(bs.user_id = :userId)', { userId: userId })
      .getOne();

    if (!subscription) {
      return null;
    } else {
      return subscription;
    }
  }
  async checkSubscriptionsToBlog(
    blogId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const subscription = await blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .where('(bs.blog_id = :blogId)', { blogId: blogId })
      .andWhere('(bs.user_id = :userId)', { userId: userId })
      .getMany();

    return subscription.length !== 0;
  }
  async getSubscriptionWithMembershipPlanByPaymentId(
    paymentId: string,
    manager?: EntityManager,
  ): Promise<BlogSubscription | null> {
    const blogsSubscriptionsQueryRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsQueryRepository;

    const subscription = await blogsSubscriptionsQueryRepository
      .createQueryBuilder('bs')
      .leftJoin('bs.paymentsBlogsMemberships', 'pbm')
      .leftJoin('bs.blogsMembershipsPlans', 'bmp')
      .addSelect('bmp.monthsCount')
      .where('pbm.id = :paymentId', { paymentId: paymentId })
      .getOne();

    if (!subscription) {
      return null;
    } else {
      return subscription;
    }
  }
}
