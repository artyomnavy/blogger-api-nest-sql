import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { HTTP_STATUSES } from '../src/common/utils';
import { badId, Paths, responseNullData } from './utils/test-constants';
import { CreateAndUpdateBlogModel } from '../src/features/blogs/api/models/blog.input.model';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';

describe('Blogs testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let user: UserOutputModel;
  let accessToken: any;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  let newBlog: BlogOutputModel | null = null;

  it('+ GET (superadmin) all blogs database', async () => {
    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundBlogs = await request(server)
      .get(Paths.blogsSA)
      .query(queryData)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  // Create by admin and log in user for blogger controller
  it('+ POST create by admin and log in user for blogs', async () => {
    // Create user
    const userData = {
      login: 'user',
      password: '123456',
      email: 'user@blog.com',
    };

    const createUserByAdmin = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      userData,
      basicLogin,
      basicPassword,
    );

    user = createUserByAdmin.body;

    expect(user).toEqual({
      id: expect.any(String),
      login: user.login,
      email: user.email,
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
      items: [user],
    });

    // Log in user and create tokens
    const authUserData = {
      loginOrEmail: user!.email,
      password: '123456',
    };

    // Create tokens for user
    const createAccessTokenForUser = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authUserData)
      .expect(HTTP_STATUSES.OK_200);

    accessToken = createAccessTokenForUser.body.accessToken;
  });

  it('+ GET (blogger) all blogs database', async () => {
    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .query(queryData)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('- POST (blogger) does not create blog with incorrect login and password)', async () => {
    const createData = {
      name: 'login',
      description: 'new blog',
      websiteUrl: 'test@blog.com',
    };

    await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      'wrongAccessToken.notCreate.jwt',
      HTTP_STATUSES.UNAUTHORIZED_401,
    );

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('- POST (blogger) does not create blog with incorrect name, description and websiteUrl)', async () => {
    const createData = {
      name: '',
      description: '',
      websiteUrl: '',
    };

    const errorsCreateBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      accessToken,
      HTTP_STATUSES.BAD_REQUEST_400,
    );

    expect(errorsCreateBlog.body).toStrictEqual({
      errorsMessages: [
        { message: expect.any(String), field: 'name' },
        { message: expect.any(String), field: 'description' },
        { message: expect.any(String), field: 'websiteUrl' },
      ],
    });

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('+ POST (blogger) create blog with correct data)', async () => {
    const createData: CreateAndUpdateBlogModel = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      accessToken,
    );

    newBlog = createBlog.body;

    expect(newBlog).toEqual({
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
      .auth(accessToken, { type: 'bearer' })
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('- GET (public) blog by ID with incorrect id', async () => {
    await request(server)
      .get(`${Paths.blogs}/${badId}`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET (public) blog by ID with correct id', async () => {
    const foundBlog = await request(server)
      .get(`${Paths.blogs}/${newBlog!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlog.body).toStrictEqual(newBlog);
  });

  it('+ GET (public) all blogs database', async () => {
    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundBlogs = await request(server)
      .get(Paths.blogs)
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('- PUT (blogger) blog by ID with incorrect id', async () => {
    const updateData = {
      name: 'Bad name',
      description: 'Bad description',
      websiteUrl: 'https://badwebsite.com',
    };

    await request(server)
      .put(`${Paths.blogsBlogger}/${badId}`)
      .auth(accessToken, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('- PUT (blogger) blog by ID with incorrect data', async () => {
    const updateData = { name: '', description: '', websiteUrl: 'bad' };

    const errorsUpdateBlog = await request(server)
      .put(`${Paths.blogsBlogger}/${newBlog!.id}`)
      .auth(accessToken, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsUpdateBlog.body).toStrictEqual({
      errorsMessages: [
        { message: expect.any(String), field: 'name' },
        { message: expect.any(String), field: 'description' },
        { message: expect.any(String), field: 'websiteUrl' },
      ],
    });

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('+ PUT (blogger) blog by ID with correct data', async () => {
    const updateData: CreateAndUpdateBlogModel = {
      name: 'New blog 2',
      description: 'New description 2',
      websiteUrl: 'https://website2.com',
    };

    await request(server)
      .put(`${Paths.blogsBlogger}/${newBlog!.id}`)
      .auth(accessToken, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body.items[0]).toEqual({
      ...newBlog,
      name: updateData.name,
      description: updateData.description,
      websiteUrl: updateData.websiteUrl,
    });

    newBlog = foundBlogs.body.items[0];
  });

  it('- DELETE (blogger) blog by ID with incorrect id', async () => {
    await request(server)
      .delete(`${Paths.blogsBlogger}/${badId}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.NOT_FOUND_404);

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('+ DELETE (blogger) blog by ID with correct id', async () => {
    await request(server)
      .delete(`${Paths.blogsBlogger}/${newBlog!.id}`)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundBlogs = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
    await server.close();
  });
});
