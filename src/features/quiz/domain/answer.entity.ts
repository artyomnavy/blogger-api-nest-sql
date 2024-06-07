import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AnswerStatuses } from '../../../common/utils';
import { PlayerSession } from './player-session.entity';
import { Question } from './question.entity';

@Entity({ name: 'answers' })
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    collation: 'C',
  })
  body: string;

  @Column({
    name: 'answer_status',
    type: 'enum',
    enum: AnswerStatuses,
  })
  answerStatus: AnswerStatuses;

  @Column('timestamp with time zone', { name: 'added_at' })
  addedAt: Date;

  @ManyToOne(() => PlayerSession, (ps) => ps.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_session_id' })
  playerSession: PlayerSession;

  @ManyToOne(() => Question, (q) => q.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
