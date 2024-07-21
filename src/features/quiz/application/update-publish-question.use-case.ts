import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { ResultCode } from '../../../common/utils';
import { ResultType } from '../../../common/types/result';

export class UpdatePublishQuestionCommand {
  constructor(
    public readonly questionId: string,
    public readonly published: boolean,
  ) {}
}
@CommandHandler(UpdatePublishQuestionCommand)
export class UpdatePublishQuestionUseCase
  implements ICommandHandler<UpdatePublishQuestionCommand>
{
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async execute(
    command: UpdatePublishQuestionCommand,
  ): Promise<ResultType<boolean>> {
    const { questionId, published } = command;

    const question =
      await this.questionsQueryRepository.getQuestionById(questionId);

    if (!question) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Question not found',
      };
    }

    if (question.published === published) {
      return {
        data: true,
        code: ResultCode.SUCCESS,
      };
    }

    await this.questionsRepository.updatePublishQuestion(
      questionId,
      published,
      new Date(),
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
