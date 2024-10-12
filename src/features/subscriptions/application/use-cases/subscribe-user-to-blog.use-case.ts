import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { ResultCode, SubscriptionStatus } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsSubscriptionsRepository } from '../../infrastructure/blogs-subscriptions-repository';
import { BlogsSubscriptionsQueryRepository } from '../../infrastructure/blogs-subscriptions-query-repository';

export class SubscribeUserToBlogCommand {
  constructor(
    public readonly userId: string,
    public readonly blogId: string,
  ) {}
}
@CommandHandler(SubscribeUserToBlogCommand)
export class SubscribeUserToBlogUseCase
  extends TransactionManagerUseCase<
    SubscribeUserToBlogCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<SubscribeUserToBlogCommand>
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
    command: SubscribeUserToBlogCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { userId, blogId } = command;

    // Проверяем существует ли пользователь
    const user = await this.usersQueryRepository.getOrmUserById(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'User is not found',
        field: 'userId',
      };
    }

    // Проверяем существует ли такой блог
    const blog = await this.blogsQueryRepository.getOrmBlogByIdWithBanInfo(
      blogId,
      manager,
    );

    if (!blog) {
      return {
        data: false,
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
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'User is owner blog',
        field: 'userId or blogId',
      };
    }

    const subscription =
      await this.blogsSubscriptionsQueryRepository.getSubscriberToBlog(
        blogId,
        userId,
        SubscriptionStatus.SUBSCRIBED,
        manager,
      );

    if (subscription) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'User is subscriber this blog',
        field: 'userId or blogId',
      };
    }

    // Подписываем пользователя на блог
    await this.blogsSubscriptionsRepository.subscribeUserToBlog(
      user,
      blog,
      SubscriptionStatus.SUBSCRIBED,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
