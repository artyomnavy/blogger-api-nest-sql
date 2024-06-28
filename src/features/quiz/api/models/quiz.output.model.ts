import { AnswerStatuses, QuizStatuses } from '../../../../common/utils';
import { PlayerSessionOutputQuizModel } from './player-session.output.model';
import { QuestionOutputQuizModel } from './question.output.model';

export class QuizOutputModel {
  id: string;
  firstPlayerProgress: PlayerSessionOutputQuizModel;
  secondPlayerProgress: PlayerSessionOutputQuizModel | null;
  questions: QuestionOutputQuizModel[] | null;
  status: QuizStatuses;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
}

export class QuizMapperModel {
  id: string;
  status: QuizStatuses;
  pairCreatedDate: Date;
  startGameDate: Date;
  finishGameDate: Date;
  sessionIdPlayer1: string;
  scorePlayer1: number;
  idPlayer1: string;
  loginPlayer1: string;
  sessionIdPlayer2: string;
  scorePlayer2: number;
  idPlayer2: string;
  loginPlayer2: string;
  questions: {
    id: string;
    body: string;
  }[];
  answersPlayer1: {
    questionId: string;
    answerStatus: AnswerStatuses;
    addedAt: Date;
  }[];
  answersPlayer2: {
    questionId: string;
    answerStatus: AnswerStatuses;
    addedAt: Date;
  }[];
}

export class StatisticOutputModel {
  sumScore: number;
  avgScores: number;
  gamesCount: number;
  winsCount: number;
  lossesCount: number;
  drawsCount: number;
}
