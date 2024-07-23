import { INestApplication } from '@nestjs/common';
import { TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { HTTP_STATUSES } from '../src/common/utils';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { Paths } from './utils/test-constants';
import jwt from 'jsonwebtoken';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  jwtSecret,
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { EmailsAdapter } from '../src/features/auth/adapters/emails-adapter';
import { EmailsAdapterMock } from './mock/emails-adapter.mock';
import { Repository } from 'typeorm';
import { User } from '../src/features/users/domain/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { initSettings } from './utils/init-settings';

describe('Auth testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let userEntity: Repository<User>;

  let newUserByAdmin: UserOutputModel | null = null;
  let newUserByRegistration: UserOutputModel | null = null;
  let accessToken: any = null;
  let refreshToken: any = null;
  let code: string | null = null;
  let recoveryCode: string | null = null;

  beforeAll(async () => {
    const testSettings = await initSettings(
      (moduleBuilder: TestingModuleBuilder) => {
        moduleBuilder
          .overrideProvider(EmailsAdapter)
          .useClass(EmailsAdapterMock);
      },
    );

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;

    userEntity = app.get(getRepositoryToken(User));
  });

  // CHECK LOGIN USER BY ADMIN, CREATE NEW USER BY ADMIN, RESEND CODE FOR CONFIRMED EMAIL

  it('- POST does not enter to system and does not create token with incorrect data', async () => {
    const authData = { loginOrEmail: 'ab', password: '12345' };

    await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- POST does not enter to system and does not create token with login or password is wrong', async () => {
    const authData = {
      loginOrEmail: 'login',
      password: 'password',
    };

    await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('+ POST create user by admin with correct data', async () => {
    const createData = {
      login: 'login',
      password: '123456',
      email: 'test@test.com',
    };

    const createUserByAdmin = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createData,
      basicLogin,
      basicPassword,
    );

    newUserByAdmin = createUserByAdmin.body;

    expect(newUserByAdmin).toEqual({
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
      items: [newUserByAdmin],
    });
  });

  it('+ POST enter to system with correct data and create access and refresh tokens', async () => {
    const authData = {
      loginOrEmail: newUserByAdmin!.email,
      password: '123456',
    };

    const createTokens = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.OK_200);

    refreshToken = createTokens.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    accessToken = createTokens.body.accessToken;
  });

  it('- GET information about user with invalid access token', async () => {
    const badAccessToken = 'wr0ngt0k3n';

    await request(server)
      .get(`${Paths.auth}/me`)
      .auth(badAccessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('+ GET information about user by admin with valid access token', async () => {
    const profile = await request(server)
      .get(`${Paths.auth}/me`)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(profile.body).toEqual({
      login: newUserByAdmin!.login,
      email: newUserByAdmin!.email,
      userId: newUserByAdmin!.id,
    });
  });

  // CHECK REFRESH TOKEN FOR USER BY ADMIN

  it("- POST dont't generate pair tokens with inside cookie is missing", async () => {
    await request(server)
      .post(`${Paths.auth}/refresh-token`)
      .set('Cookie', [`refreshToken=''`])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it("- POST don't generate pair tokens with incorrect refreshToken", async () => {
    const badRefreshToken = 'refreshToken=wr0ngt0k3n';

    await request(server)
      .post(`${Paths.auth}/refresh-token`)
      .set('Cookie', [badRefreshToken])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('+ POST generate pair tokens with correct refreshToken', async () => {
    const updateTokens = await request(server)
      .post(`${Paths.auth}/refresh-token`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(HTTP_STATUSES.OK_200);

    refreshToken = updateTokens.headers['set-cookie'][0]
      .split('=')[1]
      .split(';')[0];

    accessToken = updateTokens.body.accessToken;
  });

  // LOGOUT USER BY ADMIN

  it('+ POST logout user by admin with correct refreshToken', async () => {
    await request(server)
      .post(`${Paths.auth}/logout`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('- POST logout user by admin with inside cookie is missing', async () => {
    const badRefreshToken = `refreshToken=''`;

    await request(server)
      .post(`${Paths.auth}/logout`)
      .set('Cookie', [badRefreshToken])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- POST logout user by admin with incorrect refreshToken', async () => {
    const badRefreshToken = 'refreshToken=wr0ngt0k3n';

    await request(server)
      .post(`${Paths.auth}/logout`)
      .set('Cookie', [badRefreshToken])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  // CHECK EXPIRED REFRESH TOKEN FOR USER BY ADMIN
  it('- POST logout user by admin with expired refreshToken', async () => {
    // Update refreshToken with expiresIn = 1 ms
    const userId = newUserByAdmin!.id;
    refreshToken = jwt.sign({ userId }, jwtSecret, { expiresIn: '1' });

    await request(server)
      .post(`${Paths.auth}/logout`)
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  // CREATE NEW USER BY REGISTRATION (CREATE CODE), RESEND CODE FOR CONFIRMATION EMAIL (UPDATED CODE), CONFIRM REGISTRATION

  it('- POST resending code for user created by admin with confirmed email', async () => {
    const errorsResendCode = await request(server)
      .post(`${Paths.auth}/registration-email-resending`)
      .send({
        email: newUserByAdmin!.email,
      })
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsResendCode.body).toStrictEqual({
      errorsMessages: [{ message: expect.any(String), field: 'email' }],
    });
  });

  it('+ POST registration and create user with confirmation code for send to passed email', async () => {
    const createData = {
      login: 'artyom',
      password: 'testpass',
      email: 'artyom@test.ru', // fake email because used mock
    };

    await createEntitiesTestManager.createUserByRegistration(
      `${Paths.auth}/registration`,
      createData,
    );

    // const getUserByLogin = await dataSource.query(
    //   `SELECT
    //             "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
    //             FROM public."Users"
    //             WHERE "login" = $1`,
    //   [createData.login],
    // );

    const getUserByLogin = await userEntity
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.login = :login', { login: createData.login })
      .getOne();

    code = getUserByLogin!.confirmationCode;

    newUserByRegistration = {
      id: getUserByLogin!.id,
      login: getUserByLogin!.login,
      email: getUserByLogin!.email,
      createdAt: getUserByLogin!.createdAt.toISOString(),
      banInfo: {
        isBanned: false,
        banDate: null,
        banReason: null,
      },
    };
  });

  it('- POST does not enter to system and does not create token with unconfirmed email', async () => {
    await request(server)
      .post(`${Paths.auth}/login`)
      .send({
        loginOrEmail: newUserByRegistration!.login,
        password: 'testpass',
      })
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- POST confirm registration user with incorrect confirmation code', async () => {
    const badCode = {
      code: 'wrong code',
    };

    const errorsConfirmUser = await request(server)
      .post(`${Paths.auth}/registration-confirmation`)
      .send(badCode)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsConfirmUser.body).toStrictEqual({
      errorsMessages: [{ message: expect.any(String), field: 'code' }],
    });
  });

  it('+ POST resending code for complete registration user with email is not confirmed', async () => {
    await request(server)
      .post(`${Paths.auth}/registration-email-resending`)
      .send({
        email: newUserByRegistration!.email,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    // const getUserByLogin = await dataSource.query(
    //   `SELECT
    //             "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
    //             FROM public."Users"
    //             WHERE "login" = $1`,
    //   [newUserByRegistration!.login],
    // );

    const getUserByLogin = await userEntity
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.login = :login', { login: newUserByRegistration!.login })
      .getOne();

    code = getUserByLogin!.confirmationCode;
  });

  it('+ POST confirm registration user with correct confirmation code', async () => {
    await request(server)
      .post(`${Paths.auth}/registration-confirmation`)
      .send({
        code: code,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('- POST confirm registration user with confirmation code already been applied', async () => {
    const errorsConfirmUser = await request(server)
      .post(`${Paths.auth}/registration-confirmation`)
      .send({
        code: code,
      })
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsConfirmUser.body).toStrictEqual({
      errorsMessages: [{ message: expect.any(String), field: 'code' }],
    });
  });

  it('- POST confirm registration user with confirmation code expired', async () => {
    // Prepare data for test expirationDate
    // await dataSource.query(
    //   `UPDATE public."Users"
    //         SET "expirationDate"=$1, "isConfirmed"=$2
    //         WHERE "login" = $3`,
    //   [new Date(), false, newUserByRegistration!.login],
    // );

    await userEntity
      .createQueryBuilder()
      .update(User)
      .set({ expirationDate: new Date(), isConfirmed: false })
      .where('login = :login', { login: newUserByRegistration!.login })
      .execute();

    const errorsConfirmUser = await request(server)
      .post(`${Paths.auth}/registration-confirmation`)
      .send({
        code: code,
      })
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsConfirmUser.body).toStrictEqual({
      errorsMessages: [{ message: expect.any(String), field: 'code' }],
    });
  });

  // CHECK ATTEMPTS FROM ONE IP
  it('- POST login user with more than 5 attempts from one IP-address during 10 seconds', async () => {
    // Create user
    const createData = {
      login: 'user',
      password: 'user123',
      email: 'user@test.com',
    };

    const authData = {
      loginOrEmail: createData.login,
      password: createData.password,
    };

    const createUserByAdmin = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createData,
      basicLogin,
      basicPassword,
    );

    expect(createUserByAdmin.body).toEqual({
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

    // Check ip-restriction (because early testing with same local ip)
    await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.OK_200);

    await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.TOO_MANY_REQUESTS_429);
  });

  // CHECK RECOVERY PASSWORD

  it('+ POST password recovery with non-exist user', async () => {
    await request(server)
      .post(`${Paths.auth}/password-recovery`)
      .send({
        email: 'wrong@test.com',
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('+ POST password recovery with exist user', async () => {
    await request(server)
      .post(`${Paths.auth}/password-recovery`)
      .send({
        email: newUserByAdmin!.email,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    // const getUserByLogin = await dataSource.query(
    //   `SELECT
    //             "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
    //             FROM public."Users"
    //             WHERE "login" = $1`,
    //   [newUserByAdmin!.login],
    // );

    const getUserByLogin = await userEntity
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.login = :login', { login: newUserByAdmin!.login })
      .getOne();

    recoveryCode = getUserByLogin!.confirmationCode;
  });

  it('- POST recovery password with incorrect data', async () => {
    const newPasswordData = {
      recoveryCode: recoveryCode,
      password: '',
    };

    await request(server)
      .post(`${Paths.auth}/new-password`)
      .send(newPasswordData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- POST recovery password with old password', async () => {
    const newPasswordData = {
      recoveryCode: recoveryCode,
      newPassword: '123456',
    };

    await request(server)
      .post(`${Paths.auth}/new-password`)
      .send(newPasswordData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('+ POST new password with exist user', async () => {
    const newPasswordData = {
      recoveryCode: recoveryCode,
      newPassword: 'qwerty123',
    };

    await request(server)
      .post(`${Paths.auth}/new-password`)
      .send(newPasswordData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
