import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BanStatus, HTTP_STATUSES } from '../src/common/utils';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { CreateAndUpdateBlogModel } from '../src/features/blogs/api/models/blog.input.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';

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

  let newUser1: UserOutputModel;
  let newUser2: UserOutputModel;
  let newBlogByNewUser2: BlogOutputModel | null = null;
  let accessTokenForNewUser2: any;

  // CHECK BAN USER BY ADMIN
  it('+ GET all users database by admin', async () => {
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
      .get(Paths.usersSA)
      .auth(basicLogin, basicPassword)
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual(responseNullData);
  });

  it('+ POST create user with correct data by admin', async () => {
    const createData = {
      login: 'login',
      password: '123456',
      email: 'test@test.com',
    };

    const createUser = await createEntitiesTestManager.createUserByAdmin(
      Paths.usersSA,
      createData,
      basicLogin,
      basicPassword,
    );

    newUser1 = createUser.body;

    expect(newUser1).toEqual({
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
      .get(Paths.usersSA)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newUser1],
    });
  });

  it('+ PUT ban info user by admin', async () => {
    const updateData = {
      isBanned: true,
      banReason: '123456qwerty-length21',
    };

    await request(server)
      .put(`${Paths.usersSA}/${newUser1!.id}/ban`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundUsers = await request(server)
      .get(Paths.usersSA)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    newUser1 = {
      ...newUser1,
      banInfo: {
        ...newUser1!.banInfo,
        isBanned: updateData.isBanned,
        banReason: updateData.banReason,
        banDate: expect.any(String),
      },
    };

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newUser1],
    });
  });

  // CHECK BAN USER BY BLOGGER
  // Create by admin and log in newUser2
  it('+ POST create by admin and log in user for blogs', async () => {
    // Create user
    const userData = {
      login: 'user',
      password: '123456',
      email: 'user@blog.com',
    };

    const createUserByAdmin = await createEntitiesTestManager.createUserByAdmin(
      Paths.usersSA,
      userData,
      basicLogin,
      basicPassword,
    );

    newUser2 = createUserByAdmin.body;

    expect(newUser2).toEqual({
      id: expect.any(String),
      login: newUser2.login,
      email: newUser2.email,
      createdAt: expect.any(String),
      banInfo: {
        banDate: null,
        banReason: null,
        isBanned: false,
      },
    });

    const foundUsers = await request(server)
      .get(Paths.usersSA)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 2,
      items: [newUser2, newUser1],
    });

    // Log in newUser2 and create tokens
    const authUserData = {
      loginOrEmail: newUser2!.email,
      password: '123456',
    };

    // Create tokens for newUser2
    const createAccessTokenForUser = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authUserData)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenForNewUser2 = createAccessTokenForUser.body.accessToken;
  });

  it('+ POST create blog by blogger with correct data', async () => {
    const createData: CreateAndUpdateBlogModel = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      accessTokenForNewUser2,
    );

    newBlogByNewUser2 = createBlog.body;

    expect(newBlogByNewUser2).toEqual({
      id: expect.any(String),
      name: createData.name,
      description: createData.description,
      websiteUrl: createData.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
    });

    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessTokenForNewUser2, { type: 'bearer' })
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlogByNewUser2],
    });
  });

  it('+ PUT ban info user by blogger', async () => {
    const updateData = {
      isBanned: true,
      banReason: 'bannedUser1ToBlogUser2',
      blogId: newBlogByNewUser2!.id,
    };

    // Banned newUser1 for newBlogByNewUser2
    await request(server)
      .put(`${Paths.usersBlogger}/${newUser1.id}/ban`)
      .auth(accessTokenForNewUser2, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundUsers = await request(server)
      .get(`${Paths.usersBlogger}/blog/${newBlogByNewUser2!.id}`)
      .auth(accessTokenForNewUser2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          id: newUser1.id,
          login: newUser1.login,
          banInfo: {
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
