import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../domain/quiz.entity';
import { QuizStatuses } from '../../../utils';
import { QuizOutputModel } from '../api/models/quiz.output.model';

@Injectable()
export class QuizzesQueryRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizQueryRepository: Repository<Quiz>,
  ) {}
  async getQuizByPlayerIdInActivePair(id: string): Promise<Quiz | null> {
    const quiz = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select([
        // quiz
        'qz.id',
        'qz.status',
        'qz.pairCreatedDate',
        'qz.startGameDate',
        'qz.finishGameDate',
        // playerSession for first player
        'fps.id',
        'fps.score',
        // user info for first player
        'fpu.id',
        'fpu.login',
        // answers for first player
        'fpa.id',
        'fpa.body',
        'fpa.answerStatus',
        'fpa.addedAt',
        // question for first player
        'fpaq.id AS questionId',
        // playerSession for second player
        'sps.id',
        'sps.score',
        // user info for second player
        'spu.id',
        'spu.login',
        // answers for second player
        'spa.id',
        'spa.body',
        'spa.answerStatus',
        'spa.addedAt',
        // question for second player
        'spaq.id AS questionId',
        // questions for quiz
        'qzq.id',
        'qzq.body',
        'qzq.correctAnswers',
      ])
      .leftJoin('qz.firstPlayerSession', 'fps')
      .leftJoin('fps.player', 'fpu')
      .leftJoin('fps.answers', 'fpa')
      .leftJoin('fpa.question', 'fpaq')
      .leftJoin('qz.secondPlayerSession', 'sps')
      .leftJoin('sps.player', 'spu')
      .leftJoin('sps.answers', 'spa')
      .leftJoin('spa.question', 'spaq')
      .leftJoin('qz.questions', 'qzq')
      .where('qz.status = :status', { status: QuizStatuses.ACTIVE })
      .andWhere('fpu.id = :id OR spu.id = :id', { id: id })
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return quiz;
    }
  }
  async getQuizByPendingStatus(
    pendingStatus: QuizStatuses,
  ): Promise<Quiz | null> {
    const quiz = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select([
        'qz.id',
        'qz.status',
        'qz.pairCreatedDate',
        'qz.startGameDate',
        'qz.finishGameDate',
      ])
      .leftJoinAndSelect('qz.firstPlayerSession', 'fps')
      .leftJoinAndSelect('fps.player', 'fpsu')
      .leftJoinAndSelect('qz.secondPlayerSession', 'sps')
      .leftJoinAndSelect('sps.player', 'spsu')
      .leftJoinAndSelect('qz.questions', 'q')
      .where('qz.status = :status', { status: pendingStatus })
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return quiz;
    }
  }
  async getCurrentQuizForPlayer(
    playerId: string,
    activeStatus: QuizStatuses,
    pendingStatus: QuizStatuses,
  ): Promise<QuizOutputModel | null> {
    const quiz = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select([
        'qz.id',
        'qz.status',
        'qz.pairCreatedDate',
        'qz.startGameDate',
        'qz.finishGameDate',
      ])
      .leftJoinAndSelect('qz.firstPlayerSession', 'fps')
      .leftJoinAndSelect('fps.player', 'fpu')
      .leftJoinAndSelect('fps.answers', 'fpa')
      .leftJoinAndSelect('fpa.question', 'fpaq')
      .leftJoinAndSelect('qz.secondPlayerSession', 'sps')
      .leftJoinAndSelect('sps.player', 'spu')
      .leftJoinAndSelect('sps.answers', 'spa')
      .leftJoinAndSelect('spa.question', 'spaq')
      .leftJoinAndSelect('qz.questions', 'qzq')
      .where('qz.status = :active OR qz.status = :pending', {
        active: activeStatus,
        pending: pendingStatus,
      })
      .andWhere('fpu.id = :playerId OR spu.id = :playerId', {
        playerId: playerId,
      })
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return await this.quizMapper(quiz);
    }
  }
  async getQuizById(quizId: string): Promise<QuizOutputModel | null> {
    const quiz = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select([
        'qz.id',
        'qz.status',
        'qz.pairCreatedDate',
        'qz.startGameDate',
        'qz.finishGameDate',
      ])
      .leftJoinAndSelect('qz.firstPlayerSession', 'fps')
      .leftJoinAndSelect('fps.player', 'fpu')
      .leftJoinAndSelect('fps.answers', 'fpa')
      .leftJoinAndSelect('fpa.question', 'fpaq')
      .leftJoinAndSelect('qz.secondPlayerSession', 'sps')
      .leftJoinAndSelect('sps.player', 'spu')
      .leftJoinAndSelect('sps.answers', 'spa')
      .leftJoinAndSelect('spa.question', 'spaq')
      .leftJoinAndSelect('qz.questions', 'qzq')
      .where('qz.id = :id', { id: quizId })
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return await this.quizMapper(quiz);
    }
  }
  async quizMapper(quiz: Quiz): Promise<QuizOutputModel> {
    return {
      id: quiz.id,
      firstPlayerProgress: {
        answers:
          quiz.firstPlayerSession && quiz.firstPlayerSession.answers
            ? quiz.firstPlayerSession.answers.map((answer) => {
                return {
                  questionId: answer.question.id,
                  answerStatus: answer.answerStatus,
                  addedAt: answer.addedAt.toISOString(),
                };
              })
            : [],
        player: {
          id: quiz.firstPlayerSession.player.id,
          login: quiz.firstPlayerSession.player.login,
        },
        score: quiz.firstPlayerSession.score,
      },
      secondPlayerProgress: {
        answers:
          quiz.secondPlayerSession && quiz.secondPlayerSession.answers
            ? quiz.secondPlayerSession.answers.map((answer) => {
                return {
                  questionId: answer.question.id,
                  answerStatus: answer.answerStatus,
                  addedAt: answer.addedAt.toISOString(),
                };
              })
            : [],
        player: quiz.secondPlayerSession
          ? {
              id: quiz.secondPlayerSession.player.id,
              login: quiz.secondPlayerSession.player.login,
            }
          : {
              id: null,
              login: null,
            },
        score: quiz.secondPlayerSession ? quiz.secondPlayerSession.score : 0,
      },
      questions: quiz.questions
        ? quiz.questions.map((question) => {
            return {
              id: question.id,
              body: question.body,
            };
          })
        : [],
      status: quiz.status,
      pairCreatedDate: quiz.pairCreatedDate.toISOString(),
      startGameDate: quiz.startGameDate
        ? quiz.startGameDate.toISOString()
        : null,
      finishGameDate: quiz.finishGameDate
        ? quiz.finishGameDate.toISOString()
        : null,
    };
  }
}
