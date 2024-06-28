import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../domain/quiz.entity';
import { QuizStatuses } from '../../../common/utils';
import {
  QuizOutputModel,
  QuizMapperModel,
} from '../api/models/quiz.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';

@Injectable()
export class QuizzesQueryRepository {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizQueryRepository: Repository<Quiz>,
  ) {}
  async getAllQuizzes(
    playerId: string,
    queryData: Omit<
      PaginatorModel,
      | 'bodySearchTerm'
      | 'publishedStatus'
      | 'searchNameTerm'
      | 'searchLoginTerm'
      | 'searchEmailTerm'
    >,
  ): Promise<PaginatorOutputModel<QuizOutputModel>> {
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;
    const sortBy = queryData.sortBy ? queryData.sortBy : 'pairCreatedDate';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';

    const quizzes = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select([
        // quiz
        'qz.id AS "id"',
        'qz.status AS "status"',
        'qz.pairCreatedDate AS "pairCreatedDate"',
        'qz.startGameDate AS "startGameDate"',
        'qz.finishGameDate AS "finishGameDate"',
        // playerSession for first player
        'fps.id AS "sessionIdPlayer1"',
        'fps.score AS "scorePlayer1"',
        // user info for first player
        'fpu.id AS "idPlayer1"',
        'fpu.login AS "loginPlayer1"',
        // playerSession for second player
        'sps.id AS "sessionIdPlayer2"',
        'sps.score AS "scorePlayer2"',
        // user info for second player
        'spu.id AS "idPlayer2"',
        'spu.login AS "loginPlayer2"',
      ])
      // Подзапрос массива вопросов игры
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('id', q.id, 'body', q.body) ORDER BY qzq.index ASC)",
          )
          .from('quizzes_questions', 'qzq')
          .leftJoin('questions', 'q', 'qzq.question_id = q.id')
          .where('qzq.quiz_id = qz.id');
      }, 'questions')
      // Подзапрос массива ответов первого игрока
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('questionId', q.id, 'answerStatus', a.answerStatus, 'addedAt', a.addedAt) ORDER BY a.addedAt ASC)",
          )
          .from('answers', 'a')
          .leftJoin('questions', 'q', 'a.question_id = q.id')
          .where('a.player_session_id = fps.id');
      }, 'answersPlayer1')
      // Подзапрос массива ответов второго игрока
      .addSelect((subQuery) => {
        return subQuery
          .select(
            "json_agg(json_build_object('questionId', q.id, 'answerStatus', a.answerStatus, 'addedAt', a.addedAt) ORDER BY a.addedAt ASC)",
          )
          .from('answers', 'a')
          .leftJoin('questions', 'q', 'a.question_id = q.id')
          .where('a.player_session_id = sps.id');
      }, 'answersPlayer2')
      // Продолжение основного запроса
      .leftJoin('qz.firstPlayerSession', 'fps')
      .leftJoin('fps.player', 'fpu')
      .leftJoin('qz.secondPlayerSession', 'sps')
      .leftJoin('sps.player', 'spu')
      .where('(fpu.id = :playerId OR spu.id = :playerId)', {
        playerId,
      })
      .orderBy(`qz.${sortBy}`, sortDirection)
      .addOrderBy('qz.pairCreatedDate', 'DESC')
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.quizQueryRepository
      .createQueryBuilder('qz')
      .select('COUNT(qz.id)')
      .leftJoin('qz.firstPlayerSession', 'fps')
      .leftJoin('fps.player', 'fpu')
      .leftJoin('qz.secondPlayerSession', 'sps')
      .leftJoin('sps.player', 'spu')
      .where('(fpu.id = :playerId OR spu.id = :playerId)', {
        playerId,
      })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(quizzes.map((quiz) => this.quizRawMapper(quiz))),
    };
  }
  async getQuizByPlayerIdAndPendingOrActiveStatusForConnection(
    id: string,
  ): Promise<Quiz | null> {
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
        // quizzes and questions for quiz
        'qzq.id',
        'qzq.index',
        // questions for quiz
        'q.id',
        'q.body',
        'q.correctAnswers',
      ])
      .leftJoin('qz.firstPlayerSession', 'fps')
      .leftJoin('fps.player', 'fpu')
      .leftJoin('fps.answers', 'fpa')
      .leftJoin('fpa.question', 'fpaq')
      .leftJoin('qz.secondPlayerSession', 'sps', 'sps.id IS NOT NULL')
      .leftJoin('sps.player', 'spu', 'sps.id IS NOT NULL')
      .leftJoin('sps.answers', 'spa', 'sps.id IS NOT NULL')
      .leftJoin('spa.question', 'spaq', 'sps.id IS NOT NULL')
      .leftJoin('qz.quizQuestion', 'qzq')
      .leftJoin('qzq.question', 'q')
      .where('(fpu.id = :id OR (spu.id = :id AND sps.id IS NOT NULL))', {
        id: id,
      })
      .andWhere('(qz.status = :pending OR qz.status = :active)', {
        pending: QuizStatuses.PENDING_SECOND_PLAYER,
        active: QuizStatuses.ACTIVE,
      })
      .orderBy('qzq.index', 'ASC')
      .addOrderBy('fpa.addedAt', 'ASC')
      .addOrderBy('spa.addedAt', 'ASC')
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return quiz;
    }
  }
  async getQuizByPlayerIdAndActiveStatusForAnswer(
    id: string,
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
      .leftJoinAndSelect('fps.player', 'fpu')
      .leftJoinAndSelect('fps.answers', 'fpa')
      .leftJoinAndSelect('fpa.question', 'fpaq')
      .leftJoinAndSelect('qz.secondPlayerSession', 'sps')
      .leftJoinAndSelect('sps.player', 'spu')
      .leftJoinAndSelect('sps.answers', 'spa')
      .leftJoinAndSelect('spa.question', 'spaq')
      .leftJoinAndSelect('qz.quizQuestion', 'qzq')
      .leftJoinAndSelect('qzq.question', 'q')
      .where('(fpu.id = :playerId OR spu.id = :playerId)', {
        playerId: id,
      })
      .andWhere('qz.status = :status', {
        status: QuizStatuses.ACTIVE,
      })
      .orderBy('qzq.index', 'ASC')
      .addOrderBy('fpa.addedAt', 'ASC')
      .addOrderBy('spa.addedAt', 'ASC')
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
      .leftJoinAndSelect('qz.quizQuestion', 'qzq')
      .leftJoinAndSelect('qzq.question', 'q')
      .where('qz.status = :status', { status: pendingStatus })
      .orderBy('qzq.index', 'ASC')
      .getOne();

    if (!quiz) {
      return null;
    } else {
      return quiz;
    }
  }
  async getCurrentQuizForPlayer(
    playerId: string,
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
      .leftJoinAndSelect('qz.quizQuestion', 'qzq')
      .leftJoinAndSelect('qzq.question', 'q')
      // Вариант записи условий typeorm, т.к. при записи .where и за ним .orWhere
      // и далее .andWhere записываются последовательно без отделения "условие OR условие AND условие",
      // а нужно "(условие OR условие) AND условие"
      // .where(
      //   new Brackets((qb) =>
      //     qb
      //       .where('fpu.id = :playerId', { playerId })
      //       .orWhere('spu.id = :playerId', { playerId }),
      //   ),
      // )
      // .andWhere(
      //   new Brackets((qb) =>
      //     qb
      //       .where('qz.status = :active', { active: QuizStatuses.ACTIVE })
      //       .orWhere('qz.status = :pending', {
      //         pending: QuizStatuses.PENDING_SECOND_PLAYER,
      //       }),
      //   ),
      // )
      .where('(fpu.id = :playerId OR spu.id = :playerId)', {
        playerId,
      })
      .andWhere('(qz.status = :active OR qz.status = :pending)', {
        active: QuizStatuses.ACTIVE,
        pending: QuizStatuses.PENDING_SECOND_PLAYER,
      })
      .orderBy('qzq.index', 'ASC')
      .addOrderBy('fpa.addedAt', 'ASC')
      .addOrderBy('spa.addedAt', 'ASC')
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
      .leftJoinAndSelect('qz.quizQuestion', 'qzq')
      .leftJoinAndSelect('qzq.question', 'q')
      .where('qz.id = :id', { id: quizId })
      .orderBy('qzq.index', 'ASC')
      .addOrderBy('fpa.addedAt', 'ASC')
      .addOrderBy('spa.addedAt', 'ASC')
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
        answers: quiz.firstPlayerSession.answers
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
      secondPlayerProgress: quiz.secondPlayerSession
        ? {
            answers: quiz.secondPlayerSession.answers
              ? quiz.secondPlayerSession.answers.map((answer) => {
                  return {
                    questionId: answer.question.id,
                    answerStatus: answer.answerStatus,
                    addedAt: answer.addedAt.toISOString(),
                  };
                })
              : [],
            player: {
              id: quiz.secondPlayerSession.player.id,
              login: quiz.secondPlayerSession.player.login,
            },
            score: quiz.secondPlayerSession.score,
          }
        : null,
      questions: quiz.secondPlayerSession
        ? quiz.quizQuestion.map((quizQuestion) => {
            return {
              id: quizQuestion.question.id,
              body: quizQuestion.question.body,
            };
          })
        : null,
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
  async quizRawMapper(quiz: QuizMapperModel): Promise<QuizOutputModel> {
    return {
      id: quiz.id,
      firstPlayerProgress: {
        answers: quiz.answersPlayer1
          ? quiz.answersPlayer1.map((answer) => {
              return {
                questionId: answer.questionId,
                answerStatus: answer.answerStatus,
                addedAt: new Date(answer.addedAt).toISOString(),
              };
            })
          : [],
        player: {
          id: quiz.idPlayer1,
          login: quiz.loginPlayer1,
        },
        score: quiz.scorePlayer1,
      },
      secondPlayerProgress: quiz.sessionIdPlayer2
        ? {
            answers: quiz.answersPlayer2
              ? quiz.answersPlayer2.map((answer) => {
                  return {
                    questionId: answer.questionId,
                    answerStatus: answer.answerStatus,
                    addedAt: new Date(answer.addedAt).toISOString(),
                  };
                })
              : [],
            player: {
              id: quiz.idPlayer2,
              login: quiz.loginPlayer2,
            },
            score: quiz.scorePlayer2,
          }
        : null,
      questions: quiz.sessionIdPlayer2
        ? quiz.questions.map((question) => {
            return {
              id: question.id,
              body: question.body,
            };
          })
        : null,
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
