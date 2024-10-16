import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';
import { BlogSubscription } from '../../subscriptions/domain/blog-subscription.entity';
import { Currency } from '../../../common/utils';
import { PaymentBlogMembership } from '../../integrations/payments/domain/payment-blog-membership.entity';

@Entity({ name: 'blogs_memberships_plans' })
export class BlogMembershipPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'plan_name',
    type: 'character varying',
  })
  planName: string;

  @Column({
    name: 'months_count',
    type: 'int',
  })
  monthsCount: number;

  @Column({
    type: 'double precision',
  })
  price: number;

  @Column({ type: 'character varying' })
  currency: Currency;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Blog, (b) => b.blogsMembershipsPlans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne(() => BlogSubscription, (bs) => bs.blogsMembershipsPlans, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'blog_subscription_id' })
  blogsSubscriptions: BlogSubscription;

  @OneToOne(() => PaymentBlogMembership, (pbm) => pbm.blogMembershipPlan)
  paymentBlogMembership: PaymentBlogMembership;
}
