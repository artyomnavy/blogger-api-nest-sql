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
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CreateAnswerModel } from './models/answer.input.model';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { QuizzesQueryRepository } from '../infrastructure/quizzes.query-repository';
import { CreateOrConnectQuizCommand } from '../application/create-or-connect-quiz.use-case';
import { QuizOutputModel } from './models/quiz.output.model';
import { CreateAnswerCommand } from '../application/create-answer.use-case';
import { HTTP_STATUSES, QuizStatuses } from '../../../utils';
import { AnswerOutputModel } from './models/answer.output.model';

@Controller('pair-game-quiz/pairs')
export class QuizPublicController {
  constructor(
    private readonly quizzesQueryRepository: QuizzesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get('my-current')
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

  @Get(':quizId')
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

  @Post('connection')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async createOrConnectQuiz(
    @CurrentUserId() playerId: string,
  ): Promise<QuizOutputModel> {
    const quiz =
      await this.quizzesQueryRepository.getQuizByPlayerIdForConnection(
        playerId,
      );

    if (quiz) {
      throw new ForbiddenException(
        'Player is already participating in active pair',
      );
    }

    const newQuiz = await this.commandBus.execute(
      new CreateOrConnectQuizCommand(playerId),
    );

    if (!newQuiz) {
      throw new Error('Quiz not created or connected');
    }

    return newQuiz;
  }

  @Post('my-current/answers')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.OK_200)
  async createAnswer(
    @CurrentUserId() playerId: string,
    @Body() createModel: CreateAnswerModel,
  ): Promise<AnswerOutputModel> {
    const quiz =
      await this.quizzesQueryRepository.getQuizByPlayerIdForAnswer(playerId);

    if (
      !quiz ||
      (playerId === quiz.firstPlayerSession.player.id &&
        quiz.firstPlayerSession.answers.length === 5) ||
      (playerId === quiz.secondPlayerSession.player.id &&
        quiz.secondPlayerSession.answers.length === 5)
    ) {
      throw new ForbiddenException(
        'Player is not inside active pair or has already answered to all questions',
      );
    }

    const newAnswer = await this.commandBus.execute(
      new CreateAnswerCommand(playerId, quiz, createModel.answer),
    );

    if (!newAnswer) {
      throw new Error('Answer not created');
    }

    return newAnswer;
  }
}
