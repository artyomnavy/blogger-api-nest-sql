import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Answer } from './answer.entity';
import { User } from '../../users/domain/user.entity';

@Entity({ name: 'players_sessions' })
export class PlayerSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.playersSessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: User;

  @Column({ type: 'int', default: 0 })
  score: number;

  @OneToMany(() => Answer, (a) => a.playerSession)
  answers: Answer[];
}
