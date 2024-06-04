import { Injectable } from '@nestjs/common';
import { Quiz } from '../domain/quiz.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlayerSession } from '../domain/player-session.entity';
import { QuizStatuses } from '../../../utils';
import { Question } from '../domain/question.entity';
import { QuizOutputModel } from '../api/models/quiz.output.model';
import { QuizzesQueryRepository } from './quizzes.query-repository';
import { QuizQuestion } from '../domain/quiz-question.entity';

@Injectable()
export class QuizzesRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizzesRepository: Repository<Quiz>,
    private readonly quizzesQueryRepository: QuizzesQueryRepository,
  ) {}
  async createQuiz(createData: {
    id: string;
    firstPlayerSession: PlayerSession;
    status: QuizStatuses;
    pairCreatedDate: Date;
  }): Promise<QuizOutputModel> {
    const newQuiz = new Quiz();

    newQuiz.id = createData.id;
    newQuiz.firstPlayerSession = createData.firstPlayerSession;
    newQuiz.status = createData.status;
    newQuiz.pairCreatedDate = createData.pairCreatedDate;

    const createQuiz = await this.quizzesRepository.save(newQuiz);

    return await this.quizzesQueryRepository.quizMapper(createQuiz);
  }
  async connectingToQuiz(
    quiz: Quiz,
    updateData: {
      secondPlayerSession: PlayerSession;
      status: QuizStatuses;
      questions: Question[];
      startGameDate: Date;
    },
  ): Promise<QuizOutputModel> {
    quiz.secondPlayerSession = updateData.secondPlayerSession;
    quiz.status = updateData.status;

    quiz.quizQuestion = [];

    updateData.questions.forEach((question, index) => {
      const quizQuestion = new QuizQuestion();
      quizQuestion.quiz = quiz;
      quizQuestion.question = question;
      quizQuestion.index = index + 1;
      quiz.quizQuestion.push(quizQuestion);
    });

    quiz.startGameDate = updateData.startGameDate;

    const updateQuiz = await this.quizzesRepository.save(quiz);

    return await this.quizzesQueryRepository.quizMapper(updateQuiz);
  }
  async finishQuiz(
    quiz: Quiz,
    updateData: { finishDate: Date; status: QuizStatuses },
  ): Promise<Quiz> {
    quiz.finishGameDate = updateData.finishDate;
    quiz.status = updateData.status;

    return await this.quizzesRepository.save(quiz);
  }
}
