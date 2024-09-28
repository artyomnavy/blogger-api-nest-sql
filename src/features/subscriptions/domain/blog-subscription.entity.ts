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
    type: 'bigint',
    nullable: true,
  })
  telegramId: number | null;

  @Column({ type: 'character varying' })
  status: string;

  @ManyToOne(() => Blog, (b) => b.blogsSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne(() => User, (u) => u.blogsSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  static create(user: User, blog: Blog) {
    const blogSubscription = new BlogSubscription();

    blogSubscription.id = uuidv4();
    blogSubscription.telegramCode = null;
    blogSubscription.telegramId = null;
    blogSubscription.status = SubscriptionStatus.SUBSCRIBED;
    blogSubscription.blog = blog;
    blogSubscription.user = user;

    return blogSubscription;
  }
}
