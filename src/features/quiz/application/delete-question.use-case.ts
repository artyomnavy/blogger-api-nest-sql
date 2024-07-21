import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { ResultCode } from '../../../common/utils';
import { ResultType } from '../../../common/types/result';

export class DeleteQuestionCommand {
  constructor(public readonly questionId: string) {}
}
@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionUseCase
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async execute(command: DeleteQuestionCommand): Promise<ResultType<boolean>> {
    const { questionId } = command;

    const question =
      await this.questionsQueryRepository.getQuestionById(questionId);

    if (!question) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Question not found',
      };
    }

    await this.questionsRepository.deleteQuestion(questionId);

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
