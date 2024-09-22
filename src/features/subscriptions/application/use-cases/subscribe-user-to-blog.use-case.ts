import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/blogs.query-repository';
import { ResultCode, SubscriptionStatus } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { BlogsSubscriptionsRepository } from '../../infrastructure/blogs-subscriptions-repository';

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
    const blog =
      await this.blogsQueryRepository.getOrmBlogByIdWithUserAndBlogSubscriptionInfo(
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
    const isSubscriber = blog.blogsSubscriptions.some(
      (s) => s.user.id === userId && s.status === SubscriptionStatus.SUBSCRIBED,
    );

    if (blog.user.id === userId || isSubscriber) {
      return {
        data: false,
        code: ResultCode.BAD_REQUEST,
        message: 'User is owner or subscriber this blog',
        field: 'userId or blogId',
      };
    }

    // Подписываем пользователя на блог
    await this.blogsSubscriptionsRepository.subscribeUserToBlog(
      user,
      blog,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}