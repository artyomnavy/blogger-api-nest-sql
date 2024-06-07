import { Quiz } from '../domain/quiz.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerStatuses, QuizStatuses } from '../../../common/utils';
import { v4 as uuidv4 } from 'uuid';
import { PlayersSessionsRepository } from '../infrastructure/players-sessions.repository';
import { AnswersRepository } from '../infrastructure/answers.repository';
import { AnswerOutputModel } from '../api/models/answer.output.model';
import { QuizzesRepository } from '../infrastructure/quizzes.repository';
import { DataSource } from 'typeorm';

export class CreateAnswerCommand {
  constructor(
    public readonly playerId: string,
    public readonly quiz: Quiz,
    public readonly bodyAnswer: string,
  ) {}
}
@CommandHandler(CreateAnswerCommand)
export class CreateAnswerUseCase
  implements ICommandHandler<CreateAnswerCommand>
{
  constructor(
    private readonly answersRepository: AnswersRepository,
    private readonly playersSessionsRepository: PlayersSessionsRepository,
    private readonly quizzesRepository: QuizzesRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: CreateAnswerCommand,
  ): Promise<AnswerOutputModel | null> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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
            queryRunner.manager,
            currentPlayerSession,
            ++currentPlayerSession.score,
          );
      }

      // Создаем текущий ответ в базе данных
      const createAnswer = await this.answersRepository.createAnswer(
        queryRunner.manager,
        {
          id: uuidv4(),
          body: command.bodyAnswer,
          answerStatus: answerStatus,
          addedAt: new Date(),
          playerSession: currentPlayerSession,
          question: currentQuestion,
        },
      );

      // Проверяем необходимость завершения текущей игры путем сверки количества ответов
      // игроков игры до добавления текущего ответа
      const firstPlayerAnswers = command.quiz.firstPlayerSession.answers;
      const secondPlayerAnswers = command.quiz.secondPlayerSession.answers;

      if (
        (firstPlayerAnswers.length === 4 && secondPlayerAnswers.length === 5) ||
        (firstPlayerAnswers.length === 5 && secondPlayerAnswers.length === 4)
      ) {
        // Определение игрока, первым завершившим игру
        const fastResponder =
          firstPlayerAnswers.length > secondPlayerAnswers.length
            ? command.quiz.firstPlayerSession
            : command.quiz.secondPlayerSession;

        // Начисление дополнительного балла игроку, первым завершившим игру, при условии,
        // что есть хотя бы 1 правильный ответ на вопрос
        if (
          fastResponder.answers.some(
            (a) => a.answerStatus === AnswerStatuses.CORRECT,
          )
        ) {
          await this.playersSessionsRepository.updateScoreForPlayerSession(
            queryRunner.manager,
            fastResponder,
            ++fastResponder.score,
          );
        }

        // Завершение игры
        await this.quizzesRepository.finishQuiz(
          queryRunner.manager,
          command.quiz,
          {
            finishDate: new Date(),
            status: QuizStatuses.FINISHED,
          },
        );
      }

      await queryRunner.commitTransaction();

      return createAnswer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log('Transaction rollback: ', error);
      return null;
    } finally {
      await queryRunner.release();
    }
  }
}
