import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';
import { User } from '../../users/domain/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionStatus } from '../../../common/utils';
import { BlogMembershipPlan } from '../../memberships/domain/blog-membership-plan.entity';
import { PaymentBlogMembership } from '../../integrations/payments/domain/payment-blog-membership.entity';

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

  @Column({
    name: 'price',
    type: 'double precision',
    nullable: true,
  })
  price: number | null;

  @Column({ type: 'character varying' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @Column({
    name: 'expiration_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  expirationAt: Date | null;

  @ManyToOne(() => Blog, (b) => b.blogsSubscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne(() => User, (u) => u.blogsSubscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => BlogMembershipPlan, (bmp) => bmp.blogsSubscriptions)
  blogsMembershipsPlans: BlogMembershipPlan[];

  @OneToMany(() => PaymentBlogMembership, (pbm) => pbm.blogSubscription)
  paymentsBlogsMemberships: PaymentBlogMembership[];

  static create(user: User, blog: Blog, status: SubscriptionStatus) {
    const blogSubscription = new BlogSubscription();

    blogSubscription.id = uuidv4();
    blogSubscription.telegramCode = null;
    blogSubscription.telegramId = null;
    blogSubscription.status = status;
    blogSubscription.blog = blog;
    blogSubscription.user = user;

    return blogSubscription;
  }
}
