import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';
import { User } from '../../users/domain/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionStatus } from '../../../common/utils';
import { BlogSubscriptionCreatedEvent } from './events/blog-subscription-created.event';

@Entity({ name: 'blogs_subscriptions' })
export class BlogSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'telegram_code',
    type: 'uuid',
    nullable: true,
  })
  telegramCode: string | null;

  @Column({
    name: 'telegram_id',
    type: 'int',
    nullable: true,
  })
  telegramId: number | null;

  @Column({ type: 'character varying' })
  status: string;

  @ManyToOne(() => Blog, (b) => b.blogsSubscriptions, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog | null;

  @ManyToOne(() => User, (u) => u.blogsSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  events: any[] = [];

  static create(user: User, blog: Blog) {
    const blogSubscription = new BlogSubscription();

    blogSubscription.id = uuidv4();
    blogSubscription.telegramCode = null;
    blogSubscription.telegramId = null;
    blogSubscription.status = SubscriptionStatus.SUBSCRIBED;
    blogSubscription.blog = blog;
    blogSubscription.user = user;

    const event = new BlogSubscriptionCreatedEvent(user.id, blog.id);

    blogSubscription.events.push(event);

    return blogSubscription;
  }
}
