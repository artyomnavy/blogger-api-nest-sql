import { CreateAndUpdateQuestionModel } from '../api/models/question.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { Question } from '../api/models/question.output.model';
import { QuestionsRepository } from '../infrastructure/questions.repository';

export class CreateQuestionCommand {
  constructor(public readonly createData: CreateAndUpdateQuestionModel) {}
}
@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}
  async execute(command: CreateQuestionCommand) {
    const newQuestion = new Question(
      uuidv4(),
      command.createData.body,
      command.createData.correctAnswers,
      false,
      new Date(),
      null,
    );

    const createdQuestion =
      await this.questionsRepository.createQuestion(newQuestion);

    return createdQuestion;
  }
}
