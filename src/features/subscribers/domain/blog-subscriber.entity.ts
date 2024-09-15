import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Blog } from '../../blogs/domain/blog.entity';
import { User } from '../../users/domain/user.entity';

@Entity({ name: 'blogs_subscribers' })
export class BlogSubscriber {
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
  telegramId: string | null;

  @Column({ type: 'character varying' })
  status: string;

  @ManyToOne(() => Blog, (b) => b.blogsSubscribers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'blog_id' })
  blog: Blog | null;

  @ManyToOne(() => User, (u) => u.blogsSubscribers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
