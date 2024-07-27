import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'users_bans_by_bloggers' })
export class UserBanByBloggers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { name: 'banned', default: false })
  isBanned: boolean;

  @Column('timestamp with time zone', { name: 'ban_date', nullable: true })
  banDate: Date | null;

  @Column({
    type: 'character varying',
    name: 'ban_reason',
    nullable: true,
  })
  banReason: string | null;

  @Column({
    type: 'character varying',
    name: 'blog_id',
    nullable: true,
  })
  blogId: string | null;

  @OneToOne(() => User, (user) => user.userBanByBloggers)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
