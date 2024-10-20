import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogSubscription } from '../domain/blog-subscription.entity';
import { SubscriptionStatus } from '../../../common/utils';
import { User } from '../../users/domain/user.entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { BlogMembershipPlan } from '../../memberships/domain/blog-membership-plan.entity';
import { PaymentBlogMembership } from '../../integrations/payments/domain/payment-blog-membership.entity';

@Injectable()
export class BlogsSubscriptionsRepository {
  constructor(
    @InjectRepository(BlogSubscription)
    private readonly blogsSubscriptionsRepository: Repository<BlogSubscription>,
  ) {}
  async subscribeUserToBlog(
    user: User,
    blog: Blog,
    status: SubscriptionStatus,
    manager?: EntityManager,
  ): Promise<BlogSubscription> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const blogSubscription = BlogSubscription.create(user, blog, status);

    return await blogsSubscriptionsRepository.save(blogSubscription);
  }
  async unsubscribeUserToBlog(
    updateData: {
      blogSubscriptionId: string;
      status: SubscriptionStatus;
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
      })
      .where('id = :id', { id: updateData.blogSubscriptionId })
      .execute();

    return resultUpdateBlogSubscription.affected === 1;
  }
  async addTelegramCodeToBlogSubscription(
    subscriptionId: string,
    telegramCode: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultUpdateSubscription = await blogsSubscriptionsRepository
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
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultUpdateSubscription = await blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        telegramId: telegramId,
      })
      .where('id = :id', { id: subscriptionId })
      .execute();

    return resultUpdateSubscription.affected === 1;
  }
  async unsubscribeAllUsersToBlog(
    blogId: string,
    status: SubscriptionStatus,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultUpdateBlogSubscriptions = await blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        status: status,
      })
      .where('blog_id = :blogId', { blogId: blogId })
      .execute();

    return (resultUpdateBlogSubscriptions.affected ?? 0) > 0;
  }
  async addPlanAndPaymentMembershipToBlogSubscription(
    subscription: BlogSubscription,
    blogMembershipPlan: BlogMembershipPlan,
    payment: PaymentBlogMembership,
    manager?: EntityManager,
  ): Promise<BlogSubscription> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    if (!subscription.blogsMembershipsPlans) {
      subscription.blogsMembershipsPlans = [blogMembershipPlan];
    } else {
      subscription.blogsMembershipsPlans.push(blogMembershipPlan);
    }

    if (!subscription.paymentsBlogsMemberships) {
      subscription.paymentsBlogsMemberships = [payment];
    } else {
      subscription.paymentsBlogsMemberships.push(payment);
    }

    return blogsSubscriptionsRepository.save(subscription);
  }
  async subscribeOrRenewSubscribeToBlog(
    subscriptionId: string,
    status: SubscriptionStatus,
    expirationAt: Date,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultUpdateBlogSubscription = await blogsSubscriptionsRepository
      .createQueryBuilder()
      .update(BlogSubscription)
      .set({
        status: status,
        expirationAt: expirationAt,
      })
      .where('id = :subscriptionId', { subscriptionId: subscriptionId })
      .execute();

    return resultUpdateBlogSubscription.affected === 1;
  }
  async deleteBlogSubscriptionById(
    subscriptionId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscriptionsRepository = manager
      ? manager.getRepository(BlogSubscription)
      : this.blogsSubscriptionsRepository;

    const resultDeleteBlogSubscription =
      await blogsSubscriptionsRepository.delete(subscriptionId);

    return resultDeleteBlogSubscription.affected === 1;
  }
}
