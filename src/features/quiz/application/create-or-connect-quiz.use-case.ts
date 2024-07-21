import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { v4 as uuidv4 } from 'uuid';
import { QuizzesQueryRepository } from '../infrastructure/quizzes.query-repository';
import { QuizStatuses, ResultCode } from '../../../common/utils';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { QuizzesRepository } from '../infrastructure/quizzes.repository';
import { PlayersSessionsRepository } from '../infrastructure/players-sessions.repository';
import { ResultType } from '../../../common/types/result';
import { QuizOutputModel } from '../api/models/quiz.output.model';

export class CreateOrConnectQuizCommand {
  constructor(public readonly playerId: string) {}
}
@CommandHandler(CreateOrConnectQuizCommand)
export class CreateOrConnectQuizUseCase
  implements ICommandHandler<CreateOrConnectQuizCommand>
{
  constructor(
    private readonly quizzesQueryRepository: QuizzesQueryRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
    private readonly quizzesRepository: QuizzesRepository,
    private readonly playersSessionsRepository: PlayersSessionsRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}
  async execute(
    command: CreateOrConnectQuizCommand,
  ): Promise<ResultType<QuizOutputModel | null>> {
    const { playerId } = command;

    // Проверяем есть ли с таким игроком игра с активным статусом или ожидающим 2-го игрока
    const quiz =
      await this.quizzesQueryRepository.getQuizByPlayerIdAndPendingOrActiveStatusForConnection(
        playerId,
      );

    if (quiz) {
      return {
        data: null,
        code: ResultCode.FORBIDDEN,
        message: 'Player is already participating in active pair',
      };
    }

    // Проверяем существует ли такой пользователь (игрок)
    const player = await this.usersQueryRepository.getOrmUserById(
      command.playerId,
    );

    if (!player) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    // Для существующего пользователя (игрока) создаем сессию игры
    const newPlayerSession =
      await this.playersSessionsRepository.createPlayerSession({
        id: uuidv4(),
        player,
        score: 0,
      });

    // Проверяем есть ли игра, ожидающая второго игрока
    const pendingQuiz =
      await this.quizzesQueryRepository.getQuizByPendingStatus(
        QuizStatuses.PENDING_SECOND_PLAYER,
      );

    // Создаем новую игру (когда нет игры, ожидающей второго игрока)
    if (!pendingQuiz) {
      const quizId = uuidv4();
      const pairCreatedDate = new Date();

      const newQuiz = await this.quizzesRepository.createQuiz({
        id: quizId,
        firstPlayerSession: newPlayerSession,
        status: QuizStatuses.PENDING_SECOND_PLAYER,
        pairCreatedDate: pairCreatedDate,
      });

      return {
        data: newQuiz,
        code: ResultCode.SUCCESS,
      };
    }

    // Подключаемся к игре, ожидающей второго игрока

    // Получаем 5 случайных опубликованных вопросов
    const randomQuestions =
      await this.questionsQueryRepository.getFiveRandomQuestions();

    const connectQuiz = await this.quizzesRepository.connectingToQuiz(
      pendingQuiz,
      {
        secondPlayerSession: newPlayerSession,
        status: QuizStatuses.ACTIVE,
        questions: randomQuestions,
        startGameDate: new Date(),
      },
    );

    return {
      data: connectQuiz,
      code: ResultCode.SUCCESS,
    };
  }
}
