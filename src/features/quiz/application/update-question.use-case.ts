import { CreateAndUpdateQuestionModel } from '../api/models/question.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';

export class UpdateQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly updateData: CreateAndUpdateQuestionModel,
  ) {}
}
@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: UpdateQuestionCommand): Promise<boolean> {
    const updatedAt = new Date();

    return await this.questionsRepository.updateQuestion(
      command.id,
      command.updateData,
      updatedAt,
    );
  }
}
