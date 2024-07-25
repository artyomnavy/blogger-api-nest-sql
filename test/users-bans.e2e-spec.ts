import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BanStatus, HTTP_STATUSES } from '../src/common/utils';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { badUuid, Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';

describe('Users bans testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  let newUser: UserOutputModel | null = null;

  it('+ GET all users database', async () => {
    const queryData = {
      banStatus: BanStatus.ALL,
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
      banInfo: {
        banDate: null,
        banReason: null,
        isBanned: false,
      },
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

  it('+ PUT ban info user', async () => {
    const updateData = {
      isBanned: true,
      banReason: '123456qwerty-length21',
    };

    await request(server)
      .put(`${Paths.users}/${newUser!.id}/ban`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundUsers = await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          ...newUser,
          banInfo: {
            ...newUser!.banInfo,
            isBanned: updateData.isBanned,
            banReason: updateData.banReason,
            banDate: expect.any(String),
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
