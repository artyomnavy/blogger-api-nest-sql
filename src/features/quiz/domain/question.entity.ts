import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Quiz } from './quiz.entity';
import { Answer } from './answer.entity';

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

  @ManyToMany(() => Quiz, (qz) => qz.questions)
  quizzes: Quiz[];
}
