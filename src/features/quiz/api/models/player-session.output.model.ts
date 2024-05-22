import { AnswerOutputModel } from './answer.output.model';

export class PlayerOutputQuizModel {
  id: string | null;
  login: string | null;
}

export class PlayerSessionOutputQuizModel {
  answers: AnswerOutputModel[] | [];
  player: PlayerOutputQuizModel;
  score: number;
}
