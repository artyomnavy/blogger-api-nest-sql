import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';

export class DeleteQuestionCommand {
  constructor(public readonly id: string) {}
}
@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: DeleteQuestionCommand): Promise<boolean> {
    return await this.questionsRepository.deleteQuestion(command.id);
  }
}
