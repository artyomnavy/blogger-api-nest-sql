import { AnswerStatuses } from '../../../../utils';

export class Answer {
  constructor(
    public id: string,
    public body: string,
    public questionId: string,
    public answerStatus: AnswerStatuses,
    public addedAt: Date,
    public playerSessionId: string,
  ) {}
}

export class AnswerModel {
  id: string;
  body: string;
  questionId: string;
  answerStatus: AnswerStatuses;
  addedAt: Date;
  playerSessionId: string;
}

export class AnswerOutputModel {
  questionId: string;
  answerStatus: AnswerStatuses;
  addedAt: string;
}
