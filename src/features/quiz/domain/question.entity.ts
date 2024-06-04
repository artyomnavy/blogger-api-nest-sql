import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Answer } from './answer.entity';
import { QuizQuestion } from './quiz-question.entity';

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    length: 500,
    collation: 'C',
  })
  body: string;

  @Column({
    name: 'correct_answers',
    type: 'character varying',
    array: true,
    collation: 'C',
  })
  correctAnswers: string[];

  @Column('boolean', { default: false })
  published: boolean;

  @Column('timestamp with time zone', { name: 'created_at' })
  createdAt: Date;

  @Column('timestamp with time zone', { name: 'updated_at', nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => Answer, (a) => a.question)
  answers: Answer[];

  @OneToMany(() => QuizQuestion, (qq) => qq.question)
  @JoinColumn({ name: 'quiz_question_id' })
  quizQuestion: QuizQuestion[];

  // Вариант реализации связи многие-ко-многим при которой typeorm автоматически создает
  // промежуточную таблицу
  // @ManyToMany(() => Quiz, (qz) => qz.questions)
  // quizzes: Quiz[];
}
