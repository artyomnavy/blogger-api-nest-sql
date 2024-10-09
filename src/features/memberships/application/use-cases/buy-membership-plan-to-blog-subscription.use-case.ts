import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { ResultCode, SubscriptionStatus } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsSubscriptionsRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from '../../../subscriptions/infrastructure/blogs-subscriptions-query-repository';
import Stripe from 'stripe';
import process from 'node:process';

export class BuyMembershipPlanToBlogSubscriptionCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
    public readonly membershipPlanId: string,
    public readonly paymentSystem: string,
  ) {}
}
@CommandHandler(BuyMembershipPlanToBlogSubscriptionCommand)
export class BuyMembershipPlanToBlogSubscriptionUseCase
  extends TransactionManagerUseCase<
    BuyMembershipPlanToBlogSubscriptionCommand,
    ResultType<{ url: string } | null>
  >
  implements ICommandHandler<BuyMembershipPlanToBlogSubscriptionCommand>
{
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private blogsQueryRepository: BlogsQueryRepository,
    private blogsSubscriptionsRepository: BlogsSubscriptionsRepository,
    private blogsSubscriptionsQueryRepository: BlogsSubscriptionsQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }
  async doLogic(
    command: BuyMembershipPlanToBlogSubscriptionCommand,
    manager: EntityManager,
  ): Promise<ResultType<{ url: string } | null>> {
    const { userId, blogId, membershipPlanId, paymentSystem } = command;

    // Проверяем существует ли пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User is not found',
        field: 'userId',
      };
    }

    // Проверяем существует ли такой блог
    const blog = await this.blogsQueryRepository.getOrmBlogById(
      blogId,
      manager,
    );

    if (!blog) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'Blog not found',
      };
    }

    // Проверяем является ли пользователь владельцем или уже подписчиком блога
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (isOwnerBlog) {
      return {
        data: null,
        code: ResultCode.BAD_REQUEST,
        message: 'User is owner blog',
        field: 'userId or blogId',
      };
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getSubscriptionToBlog(
        blogId,
        userId,
        manager,
      );

    let session;

    if (subscription && subscription.status === SubscriptionStatus.SUBSCRIBED) {
      // TO DO: buy membership
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'something name',
                description: 'something description',
              },
              unit_amount: 100 * 100,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: 'http://localhost:3001/stripe/success',
        cancel_url: 'http://localhost:3001/stripe/cancel',
        client_reference_id: '21',
      });
    } else if (
      subscription &&
      subscription.status === SubscriptionStatus.UNSUBSCRIBED
    ) {
      // TO DO: update status and updatedAt and buy membership
    } else {
      // Подписываем пользователя на блог
      await this.blogsSubscriptionsRepository.subscribeUserToBlog(
        user,
        blog,
        manager,
      );

      // TO DO: buy membership
    }

    return {
      data: session.url,
      code: ResultCode.SUCCESS,
    };
  }
}
