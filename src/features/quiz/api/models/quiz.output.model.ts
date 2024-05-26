import { QuizStatuses } from '../../../../utils';
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
