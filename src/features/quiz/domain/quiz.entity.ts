import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizStatuses } from '../../../utils';
import { PlayerSession } from './player-session.entity';
import { Question } from './question.entity';

@Entity({ name: 'quizzes' })
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => PlayerSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'first_player_session_id' })
  firstPlayerSession: PlayerSession;

  @OneToOne(() => PlayerSession, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'second_player_session_id' })
  secondPlayerSession: PlayerSession;

  @Column({
    type: 'enum',
    enum: QuizStatuses,
  })
  status: QuizStatuses;

  @Column('timestamp with time zone', { name: 'pair_create_date' })
  pairCreatedDate: Date;

  @Column('timestamp with time zone', {
    name: 'start_game_date',
    nullable: true,
  })
  startGameDate: Date;

  @Column('timestamp with time zone', {
    name: 'finish_game_date',
    nullable: true,
  })
  finishGameDate: Date;

  @ManyToMany(() => Question, (q) => q.quizzes)
  @JoinTable({
    name: 'quizzes_questions',
    joinColumn: { name: 'quiz_id' },
    inverseJoinColumn: { name: 'question_id' },
  })
  questions: Question[];
}
