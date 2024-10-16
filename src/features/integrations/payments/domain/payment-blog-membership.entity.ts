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
import { BlogSubscription } from '../../../subscriptions/domain/blog-subscription.entity';
import { BlogMembershipPlan } from '../../../memberships/domain/blog-membership-plan.entity';

@Entity({ name: 'payments_blogs_memberships' })
export class PaymentBlogMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'payment_system',
    type: 'character varying',
  })
  paymentSystem: string;

  @Column({
    type: 'double precision',
  })
  price: number;

  @Column({ type: 'character varying' })
  status: string;

  @Column({ name: 'any_payment_provider_info', type: 'json' })
  anyPaymentProviderInfo: any;

  @Column({ name: 'any_confirm_payment_system_data', type: 'json' })
  anyConfirmPaymentSystemData: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => BlogSubscription, (bs) => bs.paymentsBlogsMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_subscription_id' })
  blogSubscription: BlogSubscription;

  @OneToOne(() => BlogMembershipPlan, (bmp) => bmp.paymentBlogMembership, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'blog_membership_plan_id' })
  blogMembershipPlan: BlogMembershipPlan;
}
