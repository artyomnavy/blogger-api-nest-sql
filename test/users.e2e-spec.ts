import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { HTTP_STATUSES } from '../src/utils';
import { UserOutputModel } from '../src/features/superadmin/users/api/models/user.output.model';
import { appSettings } from '../src/app.settings';
import { badUuid, Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/public/auth/api/auth.constants';

describe('Users testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appSettings(app);
    await app.init();

    server = app.getHttpServer();

    createEntitiesTestManager = new CreateEntitiesTestManager(app);

    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  let newUser: UserOutputModel | null = null;

  it('+ GET all users database', async () => {
    const queryData = {
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
      searchLoginTerm: '',
      searchEmailTerm: '',
    };

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual(responseNullData);
  });

  it('- GET all users database with incorrect basicAuth data', async () => {
    await request(server)
      .get(Paths.users)
      .auth('wrongLogin', basicPassword)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual(responseNullData);
  });

  it('- POST does not create user with incorrect data', async () => {
    const createData = {
      login: 'abcdefghijk',
      password: '12345',
      email: 'test$test.com',
    };

    const errorsCreateUser = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createData,
      basicLogin,
      basicPassword,
      HTTP_STATUSES.BAD_REQUEST_400,
    );

    expect(errorsCreateUser.body).toStrictEqual({
      errorsMessages: [
        { message: expect.any(String), field: 'login' },
        { message: expect.any(String), field: 'password' },
        { message: expect.any(String), field: 'email' },
      ],
    });

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual(responseNullData);
  });

  it('+ POST create user with correct data', async () => {
    const createData = {
      login: 'login',
      password: '123456',
      email: 'test@test.com',
    };

    const createUser = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createData,
      basicLogin,
      basicPassword,
    );

    newUser = createUser.body;

    expect(newUser).toEqual({
      id: expect.any(String),
      login: createData.login,
      email: createData.email,
      createdAt: expect.any(String),
    });

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newUser],
    });
  });

  it('- DELETE user by ID with incorrect id', async () => {
    await request(server)
      .delete(`${Paths.users}/${badUuid}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newUser],
    });
  });

  it('+ DELETE user by ID with correct id', async () => {
    await request(server)
      .delete(`${Paths.users}/${newUser!.id}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual(responseNullData);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
