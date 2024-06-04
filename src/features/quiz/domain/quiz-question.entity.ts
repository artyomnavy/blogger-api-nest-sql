import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';

// Вариант реализации связи многие-ко-многим с использованием двух связей
// один-ко-многим для того, чтобы можно было добавить еще столбец index,
// по которому можно будет сортировать случайно выбранные вопросы
@Entity({ name: 'quizzes_questions' })
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ type: 'int' })
  index: number;

  @ManyToOne(() => Question, (q) => q.quizQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Quiz, (qz) => qz.quizQuestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;
}
