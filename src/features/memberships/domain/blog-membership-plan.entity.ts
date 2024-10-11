import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';

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
    name: 'price',
    type: 'double precision',
  })
  price: number;

  @Column({ type: 'character varying' })
  currency: 'USD' | 'EUR' | 'UAH' | 'RUB' | 'GEL' | 'BYN';

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @ManyToOne(() => Blog, (b) => b.blogsMembershipsPlans, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;
}
