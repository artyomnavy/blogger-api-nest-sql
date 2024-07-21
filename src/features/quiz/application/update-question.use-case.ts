import { CreateAndUpdateQuestionModel } from '../api/models/question.input.model';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsRepository } from '../infrastructure/questions.repository';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { ResultCode } from '../../../common/utils';
import { ResultType } from '../../../common/types/result';

export class UpdateQuestionCommand {
  constructor(
    public readonly questionId: string,
    public readonly updateData: CreateAndUpdateQuestionModel,
  ) {}
}
@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionUseCase
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
  ) {}

  async execute(command: UpdateQuestionCommand): Promise<ResultType<boolean>> {
    const { questionId, updateData } = command;

    const question =
      await this.questionsQueryRepository.getQuestionById(questionId);

    if (!question) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'Question not found',
      };
    }

    await this.questionsRepository.updateQuestion(
      questionId,
      updateData,
      new Date(),
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
