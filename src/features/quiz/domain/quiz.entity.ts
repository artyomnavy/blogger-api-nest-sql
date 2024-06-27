import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { QuizStatuses } from '../../../common/utils';
import { PlayerSession } from './player-session.entity';
import { QuizQuestion } from './quiz-question.entity';

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

  @Column('timestamp with time zone', { name: 'pair_created_date' })
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

  @OneToMany(() => QuizQuestion, (qq) => qq.quiz, { cascade: ['insert'] })
  @JoinColumn({ name: 'quiz_question_id' })
  quizQuestion: QuizQuestion[];

  // Вариант реализации связи многие-ко-многим при которой typeorm автоматически создает
  // промежуточную таблицу
  // @ManyToMany(() => Question, (q) => q.quizzes)
  // @JoinTable({
  //   name: 'quizzes_questions',
  //   joinColumn: { name: 'quiz_id' },
  //   inverseJoinColumn: { name: 'question_id' },
  // })
  // questions: Question[];
}
