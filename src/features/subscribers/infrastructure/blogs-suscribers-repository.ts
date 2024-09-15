import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogSubscriber } from '../domain/blog-subscriber.entity';
import { User } from '../../users/domain/user.entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { Subscriber } from '../api/models/blog-subscribers.output.model';
import { SubscriptionStatus } from '../../../common/utils';
import { Post } from '../../posts/domain/post.entity';

@Injectable()
export class BlogSubscriberRepository {
  constructor(
    @InjectRepository(BlogSubscriber)
    private readonly blogsSubscribersRepository: Repository<BlogSubscriber>,
  ) {}
  async subscribeUserToBlog(
    subscriber: Subscriber,
    user: User,
    blog: Blog,
    manager?: EntityManager,
  ): Promise<BlogSubscriber> {
    const blogsSubscribersRepository = manager
      ? manager.getRepository(BlogSubscriber)
      : this.blogsSubscribersRepository;

    const blogSubscriber = new BlogSubscriber();

    blogSubscriber.id = subscriber.id;
    blogSubscriber.telegramCode = subscriber.telegramCode;
    blogSubscriber.telegramId = subscriber.telegramId;
    blogSubscriber.status = subscriber.status;
    blogSubscriber.user = user;
    blogSubscriber.blog = blog;

    return await blogsSubscribersRepository.save(blogSubscriber);
  }
  async unsubscribeUserToBlog(
    updateData: {
      blogSubscriberId: string;
      status: SubscriptionStatus;
      blog: null;
    },
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsSubscribersRepository = manager
      ? manager.getRepository(BlogSubscriber)
      : this.blogsSubscribersRepository;

    const resultUpdateBlogSubscriber = await blogsSubscribersRepository
      .createQueryBuilder()
      .update(BlogSubscriber)
      .set({
        status: updateData.status,
        blog: updateData.blog,
      })
      .where('id = :id', { id: updateData.blogSubscriberId })
      .execute();

    return resultUpdateBlogSubscriber.affected === 1;
  }
}
