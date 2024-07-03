import { INestApplication } from '@nestjs/common';
import { CreateEntitiesTestManager } from './utils/test-manager';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import request from 'supertest';
import { Paths, responseNullData } from './utils/test-constants';
import {
  AnswerStatuses,
  HTTP_STATUSES,
  QuizStatuses,
} from '../src/common/utils';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { QuestionOutputModel } from '../src/features/quiz/api/models/question.output.model';
import { QuizOutputModel } from '../src/features/quiz/api/models/quiz.output.model';
import { Repository } from 'typeorm';
import { Quiz } from '../src/features/quiz/domain/quiz.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { initSettings } from './utils/init-settings';

describe('Quiz testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let quizEntity: Repository<Quiz>;

  let quiz: QuizOutputModel;
  let playerOne: UserOutputModel;
  let playerTwo: UserOutputModel;
  let accessTokenOne: any;
  let accessTokenTwo: any;
  let testQuestion: QuestionOutputModel;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;

    quizEntity = app.get(getRepositoryToken(Quiz));
  });

  // Check questions
  it('+ GET found all questions with correct data', async () => {
    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body).toStrictEqual({
      pagesCount: 0,
      page: 1,
      pageSize: 10,
      totalCount: 0,
      items: [],
    });
  });

  it('+ POST create question with correct data', async () => {
    const createData = {
      body: '2 * 2 = _?',
      correctAnswers: ['4', 'four'],
    };

    const createQuestion = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      createData,
      basicLogin,
      basicPassword,
    );

    testQuestion = createQuestion.body;

    expect(testQuestion).toEqual({
      id: expect.any(String),
      body: createData.body,
      correctAnswers: createData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [testQuestion],
    });
  });

  it('+ PUT update question with correct data', async () => {
    const updateData = {
      body: '2 * 2 = _?',
      correctAnswers: ['4', 'four', 'четыре'],
    };

    await request(server)
      .put(`${Paths.questions}/${testQuestion.id}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body.items[0]).toEqual({
      ...testQuestion,
      body: updateData.body,
      correctAnswers: updateData.correctAnswers,
      updatedAt: expect.any(String),
    });

    testQuestion = foundQuestions.body.items[0];
  });

  it('+ PUT publish question with correct data', async () => {
    const publishData = {
      published: true,
    };

    await request(server)
      .put(`${Paths.questions}/${testQuestion.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body.items[0]).toEqual({
      ...testQuestion,
      published: publishData.published,
      updatedAt: expect.any(String),
    });
  });

  it('+ DELETE question by ID with correct id', async () => {
    await request(server)
      .delete(`${Paths.questions}/${testQuestion!.id}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body).toEqual(responseNullData);
  });

  // Prepare data for quiz
  // Create and publish questions for quiz
  it('+ POST create and publish questions with correct data', async () => {
    // Create 6 questions
    const questionOneData = {
      body: '1 + 1 = _?',
      correctAnswers: ['2', 'two', 'два'],
    };

    const questionTwoData = {
      body: 'What saying cow?',
      correctAnswers: ['moo', 'mu', 'му'],
    };

    const questionThreeData = {
      body: 'What town is capital of Japan?',
      correctAnswers: ['tokyo', 'tokio', 'токио'],
    };

    const questionFourData = {
      body: 'What is voltage measured in?',
      correctAnswers: ['volt', 'вольт', 'вольты', 'вольтах', 'volts'],
    };

    const questionFiveData = {
      body: '10 / 5 = _?',
      correctAnswers: ['2', 'two', 'два'],
    };

    const questionSixData = {
      body: 'How many days in December?',
      correctAnswers: ['31', 'тридцать один', 'thirty one'],
    };

    const createQuestionOne = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionOneData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionOne.body).toEqual({
      id: expect.any(String),
      body: questionOneData.body,
      correctAnswers: questionOneData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const createQuestionTwo = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionTwoData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionTwo.body).toEqual({
      id: expect.any(String),
      body: questionTwoData.body,
      correctAnswers: questionTwoData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const createQuestionThree = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionThreeData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionThree.body).toEqual({
      id: expect.any(String),
      body: questionThreeData.body,
      correctAnswers: questionThreeData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const createQuestionFour = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionFourData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionFour.body).toEqual({
      id: expect.any(String),
      body: questionFourData.body,
      correctAnswers: questionFourData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const createQuestionFive = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionFiveData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionFive.body).toEqual({
      id: expect.any(String),
      body: questionFiveData.body,
      correctAnswers: questionFiveData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    const createQuestionSix = await createEntitiesTestManager.createQuestion(
      Paths.questions,
      questionSixData,
      basicLogin,
      basicPassword,
    );

    expect(createQuestionSix.body).toEqual({
      id: expect.any(String),
      body: questionSixData.body,
      correctAnswers: questionSixData.correctAnswers,
      published: false,
      createdAt: expect.any(String),
      updatedAt: null,
    });

    // Published 6 questions
    const publishData = {
      published: true,
    };

    await request(server)
      .put(`${Paths.questions}/${createQuestionOne.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await request(server)
      .put(`${Paths.questions}/${createQuestionTwo.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await request(server)
      .put(`${Paths.questions}/${createQuestionThree.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await request(server)
      .put(`${Paths.questions}/${createQuestionFour.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await request(server)
      .put(`${Paths.questions}/${createQuestionFive.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await request(server)
      .put(`${Paths.questions}/${createQuestionSix.body.id}/publish`)
      .auth(basicLogin, basicPassword)
      .send(publishData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    // Check created and published 6 questions
    const foundQuestions = await request(server)
      .get(Paths.questions)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuestions.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 6,
      items: [
        {
          ...createQuestionSix.body,
          published: true,
          updatedAt: expect.any(String),
        },
        {
          ...createQuestionFive.body,
          published: true,
          updatedAt: expect.any(String),
        },
        {
          ...createQuestionFour.body,
          published: true,
          updatedAt: expect.any(String),
        },
        {
          ...createQuestionThree.body,
          published: true,
          updatedAt: expect.any(String),
        },
        {
          ...createQuestionTwo.body,
          published: true,
          updatedAt: expect.any(String),
        },
        {
          ...createQuestionOne.body,
          published: true,
          updatedAt: expect.any(String),
        },
      ],
    });
  });

  // Create and log in 2 players for quiz
  it('+ POST create by admin and log in 2 players for quiz', async () => {
    // Create 2 players
    const playerOneData = {
      login: 'PlayerOne',
      password: '123456',
      email: 'playerOne@quiz.com',
    };

    const playerTwoData = {
      login: 'PlayerTwo',
      password: 'qwerty',
      email: 'playerTwo@quiz.com',
    };

    const createPlayerOne = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      playerOneData,
      basicLogin,
      basicPassword,
    );

    playerOne = createPlayerOne.body;

    expect(playerOne).toEqual({
      id: expect.any(String),
      login: playerOneData.login,
      email: playerOneData.email,
      createdAt: expect.any(String),
    });

    const createPlayerTwo = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      playerTwoData,
      basicLogin,
      basicPassword,
    );

    playerTwo = createPlayerTwo.body;

    expect(playerTwo).toEqual({
      id: expect.any(String),
      login: playerTwoData.login,
      email: playerTwoData.email,
      createdAt: expect.any(String),
    });

    const foundPlayers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPlayers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 2,
      items: [playerTwo, playerOne],
    });

    // Log in 2 players and create tokens
    const authOneData = {
      loginOrEmail: playerOne!.email,
      password: '123456',
    };

    const authTwoData = {
      loginOrEmail: playerTwo!.email,
      password: 'qwerty',
    };

    const createAccessTokenOne = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authOneData)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenOne = createAccessTokenOne.body.accessToken;

    const createAccessTokenTwo = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authTwoData)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenTwo = createAccessTokenTwo.body.accessToken;
  });

  // Check quiz
  it('+ POST create new pair for quiz and connect player to existing quiz', async () => {
    // Create new pair quiz with playerOne
    const createNewPairForQuiz = await request(server)
      .post(`${Paths.quiz}/pairs/connection`)
      .auth(accessTokenOne, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    quiz = createNewPairForQuiz.body;

    expect(quiz).toStrictEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: playerOne.id,
          login: playerOne.login,
        },
        score: 0,
      },
      secondPlayerProgress: null,
      questions: null,
      status: QuizStatuses.PENDING_SECOND_PLAYER,
      pairCreatedDate: expect.any(String),
      startGameDate: null,
      finishGameDate: null,
    });

    // Connect to existing quiz with playerTwo
    const connectQuiz = await request(server)
      .post(`${Paths.quiz}/pairs/connection`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    quiz = connectQuiz.body;

    expect(quiz).toStrictEqual({
      id: expect.any(String),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: playerOne.id,
          login: playerOne.login,
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: playerTwo.id,
          login: playerTwo.login,
        },
        score: 0,
      },
      questions: [
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
      ],
      status: QuizStatuses.ACTIVE,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });
  });

  it('+ GET found quiz by id', async () => {
    const foundQuiz = await request(server)
      .get(`${Paths.quiz}/pairs/${quiz.id}`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuiz.body).toStrictEqual({
      id: quiz.id,
      firstPlayerProgress: {
        answers: [],
        player: {
          id: playerOne.id,
          login: playerOne.login,
        },
        score: 0,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: playerTwo.id,
          login: playerTwo.login,
        },
        score: 0,
      },
      questions: [
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
      ],
      status: QuizStatuses.ACTIVE,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: null,
    });

    quiz = foundQuiz.body;
  });

  it('+ GET found unfinished quiz', async () => {
    const foundQuiz = await request(server)
      .get(`${Paths.quiz}/pairs/my-current`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuiz.body).toStrictEqual(quiz);
  });

  // Create answers for quiz questions
  it('+ POST create answers for quiz', async () => {
    // Found questions for current quiz
    const currentQuizWithQuestions = await quizEntity
      .createQueryBuilder('qz')
      .select([
        'qz.id',
        'q.id',
        'q.body',
        'q.correctAnswers',
        'q.published',
        'q.createdAt',
        'q.updatedAt',
      ])
      .leftJoinAndSelect('qz.quizQuestion', 'qzq')
      .leftJoinAndSelect('qzq.question', 'q')
      .where('qz.id = :id', { id: quiz.id })
      .orderBy('qzq.index', 'ASC')
      .getOne();

    const incorrectAnswer = {
      answer: 'incorrect',
    };

    const correctAnswerOne = {
      answer:
        currentQuizWithQuestions!.quizQuestion[4].question.correctAnswers[0],
    };

    // First answers players
    const createAnswerOneByPlayerOne = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenOne, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerOneByPlayerOne.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[0].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    const createAnswerOneByPlayerTwo = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerOneByPlayerTwo.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[0].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    // Second answers players
    const createAnswerTwoByPlayerOne = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenOne, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerTwoByPlayerOne.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[1].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    const createAnswerTwoByPlayerTwo = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerTwoByPlayerTwo.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[1].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    // Third answers players
    const createAnswerThreeByPlayerOne = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenOne, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerThreeByPlayerOne.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[2].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    const createAnswerThreeByPlayerTwo = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerThreeByPlayerTwo.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[2].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    // Fourth answers players
    const createAnswerFourByPlayerOne = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenOne, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerFourByPlayerOne.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[3].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    const createAnswerFourByPlayerTwo = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerFourByPlayerTwo.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[3].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    // Fifth answers players
    const createAnswerFiveByPlayerOne = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenOne, { type: 'bearer' })
      .send(correctAnswerOne)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerFiveByPlayerOne.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[4].question.id,
      answerStatus: AnswerStatuses.CORRECT,
      addedAt: expect.any(String),
    });

    const createAnswerFiveByPlayerTwo = await request(server)
      .post(`${Paths.quiz}/pairs/my-current/answers`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .send(incorrectAnswer)
      .expect(HTTP_STATUSES.OK_200);

    expect(createAnswerFiveByPlayerTwo.body).toStrictEqual({
      questionId: currentQuizWithQuestions!.quizQuestion[4].question.id,
      answerStatus: AnswerStatuses.INCORRECT,
      addedAt: expect.any(String),
    });

    // Check results quiz after answers players
    const foundQuiz = await request(server)
      .get(`${Paths.quiz}/pairs/${quiz.id}`)
      .auth(accessTokenOne, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    quiz = foundQuiz.body;

    expect(quiz).toStrictEqual({
      id: currentQuizWithQuestions!.id,
      firstPlayerProgress: {
        answers: [
          {
            questionId: currentQuizWithQuestions!.quizQuestion[0].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[1].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[2].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[3].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[4].question.id,
            answerStatus: AnswerStatuses.CORRECT,
            addedAt: expect.any(String),
          },
        ],
        player: {
          id: playerOne.id,
          login: playerOne.login,
        },
        score: 2,
      },
      secondPlayerProgress: {
        answers: [
          {
            questionId: currentQuizWithQuestions!.quizQuestion[0].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[1].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[2].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[3].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
          {
            questionId: currentQuizWithQuestions!.quizQuestion[4].question.id,
            answerStatus: AnswerStatuses.INCORRECT,
            addedAt: expect.any(String),
          },
        ],
        player: {
          id: playerTwo.id,
          login: playerTwo.login,
        },
        score: 0,
      },
      questions: [
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
        { id: expect.any(String), body: expect.any(String) },
      ],
      status: QuizStatuses.FINISHED,
      pairCreatedDate: expect.any(String),
      startGameDate: expect.any(String),
      finishGameDate: expect.any(String),
    });
  });

  it('+ GET all quizzes for player 2', async () => {
    const foundQuizzes = await request(server)
      .get(`${Paths.quiz}/pairs/my`)
      .auth(accessTokenTwo, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundQuizzes.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [quiz],
    });
  });

  it('+ GET statistics for player 1', async () => {
    const statistics = await request(server)
      .get(`${Paths.quiz}/users/my-statistic`)
      .auth(accessTokenOne, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(statistics.body).toStrictEqual({
      sumScore: 2,
      avgScores: 2,
      gamesCount: 1,
      winsCount: 1,
      lossesCount: 0,
      drawsCount: 0,
    });
  });

  it('+ GET top players', async () => {
    // TO DO: finish write this test (add expect and query params)
    const top = await request(server).get(`${Paths.quiz}/users/top`);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
