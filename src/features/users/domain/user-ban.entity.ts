import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'users_bans' })
export class UserBan {
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

  @OneToOne(() => User, (user) => user.userBan)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
