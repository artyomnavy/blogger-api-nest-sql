import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';

export class UpdatePublishQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly published: boolean,
  ) {}
}
@CommandHandler(UpdatePublishQuestionCommand)
export class UpdatePublishQuestionUseCase
  implements ICommandHandler<UpdatePublishQuestionCommand>
{
  constructor(private readonly questionsRepository: QuestionsRepository) {}

  async execute(command: UpdatePublishQuestionCommand): Promise<boolean> {
    return await this.questionsRepository.updatePublishQuestion(
      command.id,
      command.published,
      new Date(),
    );
  }
}
