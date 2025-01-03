import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { PaginatorQuestionModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { QuestionOutputModel } from './models/question.output.model';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import {
  CreateAndUpdateQuestionModel,
  PublishQuestionModel,
} from './models/question.input.model';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/create-question.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { UpdateQuestionCommand } from '../application/update-question.use-case';
import { UpdatePublishQuestionCommand } from '../application/update-publish-question.use-case';
import { DeleteQuestionCommand } from '../application/delete-question.use-case';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';

@Controller('sa/quiz/questions')
export class QuizSAController {
  constructor(
    private readonly questionsQueryRepository: QuestionsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllQuestions(
    @Query() query: PaginatorQuestionModel,
  ): Promise<PaginatorOutputModel<QuestionOutputModel>> {
    const questions: PaginatorOutputModel<QuestionOutputModel> =
      await this.questionsQueryRepository.getAllQuestions(query);

    return questions;
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createQuestion(
    @Body() createModel: CreateAndUpdateQuestionModel,
  ): Promise<QuestionOutputModel> {
    const newQuestion = await this.commandBus.execute(
      new CreateQuestionCommand(createModel),
    );

    return newQuestion;
  }
  @Put(':questionId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateQuestion(
    @Param('questionId', UuidPipe) questionId: string,
    @Body() updateModel: CreateAndUpdateQuestionModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdateQuestionCommand(questionId, updateModel),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
  @Put(':questionId/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updatePublishQuestion(
    @Param('questionId', UuidPipe) questionId: string,
    @Body() publishData: PublishQuestionModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdatePublishQuestionCommand(questionId, publishData.published),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
  @Delete(':questionId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteQuestion(@Param('questionId', UuidPipe) questionId: string) {
    const result = await this.commandBus.execute(
      new DeleteQuestionCommand(questionId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
}
