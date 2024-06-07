import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { HTTP_STATUSES } from '../src/common/utils';
import { appSettings } from '../src/app.settings';
import { Paths } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

describe('Devices testing (e2e)', () => {
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

  const createUserData = [
    {
      login: 'user1',
      password: '123456',
      email: 'user1@test.com',
    },
    {
      login: 'user2',
      password: '654321',
      email: 'user2@test.com',
    },
  ];

  let newUser1: UserOutputModel | null = null;
  let newUser2: UserOutputModel | null = null;

  let accessToken1: string | null = null;
  let refreshToken1: string | null = null;
  let payload1: any = null;
  let deviceId1: string | null = null;

  let accessToken2: string | null = null;
  let refreshToken2: string | null = null;
  let payload2: any = null;
  let deviceId2: string | null = null;

  let accessToken3: string | null = null;
  let refreshToken3: string | null = null;
  let payload3: any = null;
  let deviceId3: string | null = null;

  let accessToken4: string | null = null;
  let refreshToken4: string | null = null;
  let payload4: any = null;
  let deviceId4: string | null = null;

  const userAgent = {
    title1: 'device1',
    title2: 'device2',
    title3: 'device3',
    title4: 'device4',
    title5: 'device5',
  };

  let refreshTokenForUser2: string | null = null;

  // CREATE USER1
  it('+ POST create user by admin with correct data', async () => {
    const createUser1 = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createUserData[0],
      basicLogin,
      basicPassword,
    );

    newUser1 = createUser1.body;

    expect(newUser1).toEqual({
      id: expect.any(String),
      login: createUserData[0].login,
      email: createUserData[0].email,
      createdAt: expect.any(String),
    });

    await request(server)
      .get(Paths.users)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200, {
        pagesCount: 1,
        page: 1,
        pageSize: 10,
        totalCount: 1,
        items: [newUser1],
      });
  });

  // LOGIN USER1 TO THE SYSTEM 4 TIMES WITH DIFFERENT USER-AGENT AND IPS
  it('+ POST enter to system 4 times with different user-agent and ips', async () => {
    const deviceSession1 = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: createUserData[0].email,
        password: createUserData[0].password,
      })
      .set('User-Agent', userAgent.title1)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken1 = deviceSession1.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    accessToken1 = deviceSession1.body.accessToken;

    payload1 = jwt.decode(refreshToken1);

    deviceId1 = payload1.deviceId;

    const deviceSession2 = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: createUserData[0].email,
        password: createUserData[0].password,
      })
      .set('User-Agent', userAgent.title2)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken2 = deviceSession2.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    accessToken2 = deviceSession2.body.accessToken;

    payload2 = jwt.decode(refreshToken2);

    deviceId2 = payload2.deviceId;

    const deviceSession3 = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: createUserData[0].email,
        password: createUserData[0].password,
      })
      .set('User-Agent', userAgent.title3)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken3 = deviceSession3.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    accessToken3 = deviceSession3.body.accessToken;

    payload3 = jwt.decode(refreshToken3);

    deviceId3 = payload3.deviceId;

    const deviceSession4 = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: createUserData[0].email,
        password: createUserData[0].password,
      })
      .set('User-Agent', userAgent.title4)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken4 = deviceSession4.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    accessToken4 = deviceSession4.body.accessToken;

    payload4 = jwt.decode(refreshToken4);

    deviceId4 = payload4.deviceId;
  });

  // CHECK RESPONSE ERRORS CODE 401, 403 AND 404
  it('- DELETE device session by id with incorrect data refreshToken', async () => {
    await request(server)
      .delete(`${Paths.security}/devices/${deviceId1}`)
      .set('Cookie', [`refreshToken=''`])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- DELETE device session by id with incorrect deviceId)', async () => {
    await request(server)
      .delete(`${Paths.security}/devices/${uuidv4()}`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('- DELETE device session by id with incorrect userId', async () => {
    // Create user2 and device session
    const createUser2 = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createUserData[1],
      basicLogin,
      basicPassword,
    );

    newUser2 = createUser2.body;

    expect(newUser2).toStrictEqual({
      id: expect.any(String),
      login: createUserData[1].login,
      email: createUserData[1].email,
      createdAt: expect.any(String),
    });

    const deviceSessionForUser2 = await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: createUserData[1].email,
        password: createUserData[1].password,
      })
      .set('User-Agent', userAgent.title5)
      .expect(HTTP_STATUSES.OK_200);

    refreshTokenForUser2 = deviceSessionForUser2.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    // check response error code 403
    await request(server)
      .delete(`${Paths.security}/devices/${deviceId1}`)
      .set('Cookie', [`refreshToken=${refreshTokenForUser2}`])
      .expect(HTTP_STATUSES.FORBIDDEN_403);
  });

  // DELETE DEVICE SESSION FOR USER2
  it('+ DELETE device session by id with correct data', async () => {
    const payloadForUser2: any = jwt.decode(refreshTokenForUser2!);

    await request(server)
      .delete(`${Paths.security}/devices/${payloadForUser2.deviceId}`)
      .set('Cookie', [`refreshToken=${refreshTokenForUser2}`])
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  // UPDATE REFRESH TOKEN DEVICE1 FOR USER1
  it('+ POST generate pair tokens with correct refreshToken', async () => {
    const updateTokens = await request(server)
      .post(`${Paths.auth}/refresh-token`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .set('User-Agent', userAgent.title1)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken1 = updateTokens.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];
    accessToken1 = updateTokens.body.accessToken;

    payload1 = jwt.decode(refreshToken1);
  });

  // GET ALL DEVICES SESSIONS
  it('- GET all devices sessions with incorrect refresh token)', async () => {
    const badRefreshToken = 'wr0ngRT';

    await request(server)
      .get(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${badRefreshToken}`])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('+ GET all devices sessions with refresh token)', async () => {
    const devicesSessions = [
      {
        ip: expect.any(String),
        title: userAgent.title2,
        lastActiveDate: new Date(payload2.iat * 1000).toISOString(),
        deviceId: payload2.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title3,
        lastActiveDate: new Date(payload3.iat * 1000).toISOString(),
        deviceId: payload3.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title4,
        lastActiveDate: new Date(payload4.iat * 1000).toISOString(),
        deviceId: payload4.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title1,
        lastActiveDate: new Date(payload1.iat * 1000).toISOString(),
        deviceId: payload1.deviceId,
      },
    ];

    const foundDevicesSessions = await request(server)
      .get(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.OK_200);

    expect(foundDevicesSessions.body).toStrictEqual(devicesSessions);
  });

  // DELETE DEVICE SESSION 2
  it('+ DELETE deviceSession2 by id with correct data', async () => {
    const devicesSessions = [
      {
        ip: expect.any(String),
        title: userAgent.title3,
        lastActiveDate: new Date(payload3.iat * 1000).toISOString(),
        deviceId: payload3.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title4,
        lastActiveDate: new Date(payload4.iat * 1000).toISOString(),
        deviceId: payload4.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title1,
        lastActiveDate: new Date(payload1.iat * 1000).toISOString(),
        deviceId: payload1.deviceId,
      },
    ];

    await request(server)
      .delete(`${Paths.security}/devices/${deviceId2}`)
      .set('Cookie', [`refreshToken=${refreshToken2}`])
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundDevicesSessions = await request(server)
      .get(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.OK_200);

    expect(foundDevicesSessions.body).toStrictEqual(devicesSessions);
  });

  // LOGOUT DEVICE 3
  it('+ POST logout device3 with correct data', async () => {
    const devicesSessions = [
      {
        ip: expect.any(String),
        title: userAgent.title4,
        lastActiveDate: new Date(payload4.iat * 1000).toISOString(),
        deviceId: payload4.deviceId,
      },
      {
        ip: expect.any(String),
        title: userAgent.title1,
        lastActiveDate: new Date(payload1.iat * 1000).toISOString(),
        deviceId: payload1.deviceId,
      },
    ];

    await request(server)
      .post(`${Paths.auth}/logout`)
      .set('Cookie', [`refreshToken=${refreshToken3}`])
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundDevicesSessions = await request(server)
      .get(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.OK_200);

    expect(foundDevicesSessions.body).toStrictEqual(devicesSessions);
  });

  // TERMINATE ALL OTHERS DEVICES SESSIONS FOR USER
  it('+ DELETE all others devices sessions with correct data', async () => {
    const devicesSessions = [
      {
        ip: expect.any(String),
        title: userAgent.title1,
        lastActiveDate: new Date(payload1.iat * 1000).toISOString(),
        deviceId: payload1.deviceId,
      },
    ];

    await request(server)
      .delete(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundDevicesSessions = await request(server)
      .get(`${Paths.security}/devices`)
      .set('Cookie', [`refreshToken=${refreshToken1}`])
      .expect(HTTP_STATUSES.OK_200);

    expect(foundDevicesSessions.body).toEqual(devicesSessions);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
