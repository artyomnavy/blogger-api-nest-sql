import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/domain/user.entity';

@Entity({ name: 'users_bans_by_admin' })
export class UserBanByAdmin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { name: 'is_banned', default: false })
  isBanned: boolean;

  @Column('timestamp with time zone', { name: 'ban_date', nullable: true })
  banDate: Date | null;

  @Column({
    type: 'character varying',
    name: 'ban_reason',
    nullable: true,
  })
  banReason: string | null;

  @OneToOne(() => User, (user) => user.userBanByAdmin, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
