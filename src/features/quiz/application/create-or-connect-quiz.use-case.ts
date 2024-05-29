import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { v4 as uuidv4 } from 'uuid';
import { QuizzesQueryRepository } from '../infrastructure/quizzes.query-repository';
import { QuizStatuses } from '../../../utils';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { QuizzesRepository } from '../infrastructure/quizzes.repository';
import { PlayersSessionsRepository } from '../infrastructure/players-sessions.repository';

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
  async execute(command: CreateOrConnectQuizCommand) {
    // Проверяем существует ли такой пользователь (игрок)
    const player = await this.usersQueryRepository.getUserByIdForQuiz(
      command.playerId,
    );

    if (!player) {
      return null;
    }

    // Для существующего пользователя (игрока) создаем сессию игры
    const newPlayerSession =
      await this.playersSessionsRepository.createPlayerSession({
        id: uuidv4(),
        player,
        score: 0,
      });

    // Проверяем есть ли игра, ожидающая второго игрока
    const quiz = await this.quizzesQueryRepository.getQuizByPendingStatus(
      QuizStatuses.PENDING_SECOND_PLAYER,
    );

    // Создаем новую игру (когда нет игры, ожидающей второго игрока)
    if (!quiz) {
      const quizId = uuidv4();
      const pairCreatedDate = new Date();

      const newQuiz = await this.quizzesRepository.createQuiz({
        id: quizId,
        firstPlayerSession: newPlayerSession,
        status: QuizStatuses.PENDING_SECOND_PLAYER,
        pairCreatedDate: pairCreatedDate,
      });

      return newQuiz;
    }

    // Подключаемся к игре, ожидающей второго игрока

    // Получаем 5 случайных опубликованных вопросов
    const randomQuestions =
      await this.questionsQueryRepository.getFiveRandomQuestions();

    // randomQuestions = randomQuestions.sort(
    //   (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    // );

    const connectQuiz = await this.quizzesRepository.connectingToQuiz(quiz, {
      secondPlayerSession: newPlayerSession,
      status: QuizStatuses.ACTIVE,
      questions: randomQuestions,
      startGameDate: new Date(),
    });

    return connectQuiz;
  }
}
