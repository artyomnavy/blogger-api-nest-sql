import { Quiz } from '../domain/quiz.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnswerStatuses, QuizStatuses } from '../../../utils';
import { PlayersSessionsQueryRepository } from '../infrastructure/players-sessions.query-repository';
import { QuestionsQueryRepository } from '../infrastructure/questions.query-repository';
import { v4 as uuidv4 } from 'uuid';
import { PlayersSessionsRepository } from '../infrastructure/players-sessions.repository';
import { AnswersRepository } from '../infrastructure/answers.repository';
import { AnswerOutputModel } from '../api/models/answer.output.model';
import { QuizzesRepository } from '../infrastructure/quizzes.repository';

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
    private readonly playersSessionsQueryRepository: PlayersSessionsQueryRepository,
    private readonly questionsQueryRepository: QuestionsQueryRepository,
    private readonly quizzesRepository: QuizzesRepository,
  ) {}

  async execute(
    command: CreateAnswerCommand,
  ): Promise<AnswerOutputModel | null> {
    // Находим сессию игры и ответы для текущего игрока
    // Присваиваем currentPlayerSessionId и currentAnswers значения по умолчанию
    let currentPlayerSessionId = command.quiz.firstPlayerSession.id;
    let currentAnswers = command.quiz.firstPlayerSession.answers;

    // Если id игрока принадлежит второму игроку, то меняем значения переменных
    // currentPlayerSessionId и currentAnswers
    if (command.playerId === command.quiz.secondPlayerSession.player.id) {
      currentPlayerSessionId = command.quiz.secondPlayerSession.id;
      currentAnswers = command.quiz.secondPlayerSession.answers;
    }

    // Находим сессию и вопрос для текущего игрока (для дальнейшего обновления, при
    // необходимости, и добавления для создания текущего ответа)
    let currentPlayerSession =
      await this.playersSessionsQueryRepository.getPlayerSessionById(
        currentPlayerSessionId,
      );

    if (!currentPlayerSession) {
      return null;
    }

    const currentQuestion =
      await this.questionsQueryRepository.getQuestionByIdForQuiz(
        command.quiz.questions[currentAnswers.length].id,
      );

    if (!currentQuestion) {
      return null;
    }

    // Присваиваем статусу текущего ответа значение по умолчанию
    let answerStatus = AnswerStatuses.INCORRECT;

    // Проверяем есть ли ответ текущего игрока в массиве правильных ответов вопроса
    // Текущий вопрос определяем по количеству уже имеющихся ответов для текущего игрока
    const isCorrectAnswer = command.quiz.questions[
      currentAnswers.length ? currentAnswers.length : 0
    ].correctAnswers.includes(command.bodyAnswer);

    // Если текущий ответ правильный, то меняем ему статус и увеличиваем счет текущего игрока
    if (isCorrectAnswer) {
      answerStatus = AnswerStatuses.CORRECT;

      currentPlayerSession =
        await this.playersSessionsRepository.updateScoreForPlayerSession(
          currentPlayerSession,
          ++currentPlayerSession.score,
        );
    }

    // Создаем текущий ответ в базе данных
    const createAnswer = await this.answersRepository.createAnswer({
      id: uuidv4(),
      body: command.bodyAnswer,
      answerStatus: answerStatus,
      addedAt: new Date(),
      playerSession: currentPlayerSession,
      question: currentQuestion,
    });

    // Проверяем необходимость завершения текущей игры путем сверки количества ответов
    // игроков игры до добавления текущего ответа
    if (
      (command.quiz.firstPlayerSession.answers.length === 4 &&
        command.quiz.secondPlayerSession.answers.length === 5) ||
      (command.quiz.firstPlayerSession.answers.length === 5 &&
        command.quiz.secondPlayerSession.answers.length === 4)
    ) {
      // Проверка игрока, первым завершившим игру, для начисления дополнительного
      // балла к счету при условии, что есть хотя бы 1 правильный ответ на вопрос
      if (
        command.quiz.firstPlayerSession.answers.length === 5 &&
        command.quiz.firstPlayerSession.answers.some(
          (a) => a.answerStatus === AnswerStatuses.CORRECT,
        )
      ) {
        await this.playersSessionsRepository.updateScoreForPlayerSession(
          command.quiz.firstPlayerSession,
          ++command.quiz.firstPlayerSession.score,
        );
      } else {
        await this.playersSessionsRepository.updateScoreForPlayerSession(
          command.quiz.secondPlayerSession,
          ++command.quiz.secondPlayerSession.score,
        );
      }

      await this.quizzesRepository.finishQuiz(command.quiz, {
        finishDate: new Date(),
        status: QuizStatuses.FINISHED,
      });
    }

    return createAnswer;
  }
}
