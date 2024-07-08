import { Quiz } from '../domain/quiz.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerStatuses, QuizStatuses } from '../../../common/utils';
import { v4 as uuidv4 } from 'uuid';
import { PlayersSessionsRepository } from '../infrastructure/players-sessions.repository';
import { AnswersRepository } from '../infrastructure/answers.repository';
import { AnswerOutputModel } from '../api/models/answer.output.model';
import { QuizzesRepository } from '../infrastructure/quizzes.repository';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../common/use-cases/transaction.use-case';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Answer } from '../domain/answer.entity';
import { PlayerSession } from '../domain/player-session.entity';

export class CreateAnswerCommand {
  constructor(
    public readonly playerId: string,
    public readonly quiz: Quiz,
    public readonly bodyAnswer: string,
  ) {}
}

@CommandHandler(CreateAnswerCommand)
export class CreateAnswerUseCase
  extends TransactionManagerUseCase<
    CreateAnswerCommand,
    AnswerOutputModel | null
  >
  implements ICommandHandler<CreateAnswerCommand>
{
  constructor(
    private readonly answersRepository: AnswersRepository,
    private readonly playersSessionsRepository: PlayersSessionsRepository,
    private readonly quizzesRepository: QuizzesRepository,
    protected readonly dataSource: DataSource,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: CreateAnswerCommand,
    manager: EntityManager,
  ): Promise<AnswerOutputModel | null> {
    // Находим сессию игры и ответы для текущего игрока
    // Присваиваем currentPlayerSession и currentAnswers значения по умолчанию
    let currentPlayerSession = command.quiz.firstPlayerSession;
    let currentAnswers = command.quiz.firstPlayerSession.answers;

    // Если id игрока принадлежит второму игроку, то меняем значения переменных
    // currentPlayerSession и currentAnswers
    if (command.playerId === command.quiz.secondPlayerSession.player.id) {
      currentPlayerSession = command.quiz.secondPlayerSession;
      currentAnswers = command.quiz.secondPlayerSession.answers;
    }

    // Находим текущий вопрос для создания текущего ответа игрока
    const currentQuestion =
      command.quiz.quizQuestion[currentAnswers.length].question;

    // Присваиваем статусу текущего ответа значение по умолчанию
    let answerStatus = AnswerStatuses.INCORRECT;

    // Проверяем есть ли ответ текущего игрока в массиве правильных ответов вопроса
    // Текущий вопрос определяем по количеству уже имеющихся ответов для текущего игрока
    const isCorrectAnswer = command.quiz.quizQuestion[
      currentAnswers.length ? currentAnswers.length : 0
    ].question.correctAnswers.includes(command.bodyAnswer);

    // Если текущий ответ правильный, то меняем ему статус и увеличиваем счет текущего игрока
    if (isCorrectAnswer) {
      answerStatus = AnswerStatuses.CORRECT;

      currentPlayerSession =
        await this.playersSessionsRepository.updateScoreForPlayerSession(
          manager,
          currentPlayerSession,
          ++currentPlayerSession.score,
        );
    }

    // Создаем текущий ответ в базе данных
    const createAnswer = await this.answersRepository.createAnswer(manager, {
      id: uuidv4(),
      body: command.bodyAnswer,
      answerStatus: answerStatus,
      addedAt: new Date(),
      playerSession: currentPlayerSession,
      question: currentQuestion,
    });

    // Ответы игроков до добавления текущего ответа
    const firstPlayerAnswers = command.quiz.firstPlayerSession.answers;
    const secondPlayerAnswers = command.quiz.secondPlayerSession.answers;

    // Проверяем, что если какой-либо игрок ответил на все вопросы (до добавления текущего ответа),
    // то другому игроку дается 10 секунд для ответа на оставшиеся вопросы,
    // либо игра завершается по истечении отведенного времени на ответы
    if (
      (currentAnswers.length === 4 &&
        command.playerId === command.quiz.firstPlayerSession.player.id &&
        secondPlayerAnswers.length !== 5) ||
      (currentAnswers.length === 4 &&
        command.playerId === command.quiz.secondPlayerSession.player.id &&
        firstPlayerAnswers.length !== 5)
    ) {
      // Меняем свойство-флаг (таймаут добавлен)
      this.timeoutAdded = true;

      // Устанавливаем имя динамического таймаута
      const timeoutName = `Timeout finish quiz with id ${command.quiz.id} executing after 10 seconds`;

      // Устанавливаем динамический таймаут
      const timeout = setTimeout(async () => {
        await this.updateScoreAndFinishQuiz(
          currentAnswers,
          manager,
          currentPlayerSession,
          command.quiz,
        );

        // Удаляем таймаут
        this.schedulerRegistry.deleteTimeout(timeoutName);

        // Меняем свойство-флаг (таймаут удален)
        this.timeoutAdded = false;
      }, 10000);

      // Добавляем таймаут
      this.schedulerRegistry.addTimeout(timeoutName, timeout);
    }

    // Проверяем необходимость завершения текущей игры путем сверки количества ответов
    // игроков игры до добавления текущего ответа
    if (
      (firstPlayerAnswers.length === 4 && secondPlayerAnswers.length === 5) ||
      (firstPlayerAnswers.length === 5 && secondPlayerAnswers.length === 4)
    ) {
      // Определение игрока, первым завершившим игру
      const fastResponder =
        firstPlayerAnswers.length > secondPlayerAnswers.length
          ? command.quiz.firstPlayerSession
          : command.quiz.secondPlayerSession;

      await this.updateScoreAndFinishQuiz(
        fastResponder.answers,
        manager,
        fastResponder,
        command.quiz,
      );
    }

    return createAnswer;
  }
  private async updateScoreAndFinishQuiz(
    answers: Answer[],
    manager: EntityManager,
    playerSession: PlayerSession,
    quiz: Quiz,
  ) {
    // Начисление дополнительного балла игроку, первым завершившим игру, при условии,
    // что есть хотя бы 1 правильный ответ на вопрос
    if (answers.some((a) => a.answerStatus === AnswerStatuses.CORRECT)) {
      await this.playersSessionsRepository.updateScoreForPlayerSession(
        manager,
        playerSession,
        ++playerSession.score,
      );
    }

    // Завершение игры
    await this.quizzesRepository.finishQuiz(manager, quiz, {
      finishDate: new Date(),
      status: QuizStatuses.FINISHED,
    });
  }
}
