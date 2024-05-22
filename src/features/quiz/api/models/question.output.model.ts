export class Question {
  constructor(
    public id: string,
    public body: string,
    public correctAnswers: string[],
    public published: boolean,
    public createdAt: Date,
    public updatedAt: Date | null,
  ) {}
}

export class QuestionModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export class QuestionOutputModel {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export class QuestionOutputQuizModel {
  id: string;
  body: string;
}
