import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CreateAnswerModel } from './models/answer.input.model';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { QuizzesQueryRepository } from '../infrastructure/quizzes.query-repository';
import { CreateOrConnectQuizCommand } from '../application/create-or-connect-quiz.use-case';
import {
  QuizOutputModel,
  StatisticOutputModel,
} from './models/quiz.output.model';
import { CreateAnswerCommand } from '../application/create-answer.use-case';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { AnswerOutputModel } from './models/answer.output.model';
import {
  PaginatorBaseModel,
  PaginatorTopQuizModel,
} from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { PlayerOutputQuizModel } from './models/player-session.output.model';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';

@Controller('pair-game-quiz')
export class QuizPublicController {
  constructor(
    private readonly quizzesQueryRepository: QuizzesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get('pairs/my')
  @UseGuards(JwtBearerAuthGuard)
  async getAllQuizzes(
    @Query()
    query: PaginatorBaseModel,
    @CurrentUserId() playerId: string,
  ): Promise<PaginatorOutputModel<QuizOutputModel>> {
    const quizzes = await this.quizzesQueryRepository.getAllQuizzes(
      playerId,
      query,
    );

    return quizzes;
  }

  @Get('users/my-statistic')
  @UseGuards(JwtBearerAuthGuard)
  async getStatisticPlayer(
    @CurrentUserId() playerId: string,
  ): Promise<StatisticOutputModel> {
    const statistic =
      await this.quizzesQueryRepository.getStatisticPlayer(playerId);

    return statistic;
  }

  @Get('users/top')
  async getTopPlayers(
    @Query()
    query: PaginatorTopQuizModel,
  ): Promise<
    PaginatorOutputModel<
      StatisticOutputModel & { player: PlayerOutputQuizModel }
    >
  > {
    const top = await this.quizzesQueryRepository.getTopPlayers(query);

    return top;
  }

  @Get('pairs/my-current')
  @UseGuards(JwtBearerAuthGuard)
  async getCurrentQuiz(
    @CurrentUserId() playerId: string,
  ): Promise<QuizOutputModel> {
    const quiz =
      await this.quizzesQueryRepository.getCurrentQuizForPlayer(playerId);

    if (!quiz) {
      throw new NotFoundException(`Player not found in active quiz`);
    }

    return quiz;
  }

  @Get('pairs/:quizId')
  @UseGuards(JwtBearerAuthGuard)
  async getQuizById(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @CurrentUserId() playerId: string,
  ): Promise<QuizOutputModel> {
    const quiz = await this.quizzesQueryRepository.getQuizById(quizId);

    if (!quiz) {
      throw new NotFoundException(`Quiz not found`);
    }

    if (
      (quiz.firstPlayerProgress.player.id !== playerId &&
        !quiz.secondPlayerProgress) ||
      (quiz.firstPlayerProgress.player.id !== playerId &&
        quiz.secondPlayerProgress !== null &&
        quiz.secondPlayerProgress.player.id !== playerId)
    ) {
      throw new ForbiddenException(
        'Player tries to get pair in which he is not participant',
      );
    }

    return quiz;
  }

  @Post('pairs/connection')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async createOrConnectQuiz(
    @CurrentUserId() playerId: string,
  ): Promise<QuizOutputModel> {
    const result = await this.commandBus.execute(
      new CreateOrConnectQuizCommand(playerId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return result.data;
  }

  @Post('pairs/my-current/answers')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async createAnswer(
    @CurrentUserId() playerId: string,
    @Body() createModel: CreateAnswerModel,
  ): Promise<AnswerOutputModel> {
    const result = await this.commandBus.execute(
      new CreateAnswerCommand(playerId, createModel.answer),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return result.data;
  }
}
