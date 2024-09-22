import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  HTTP_STATUSES,
  LikeStatuses,
  SubscriptionStatus,
} from '../src/common/utils';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { Paths } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { CreateAndUpdateBlogModel } from '../src/features/blogs/api/models/blog.input.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { CreateAndUpdatePostModel } from '../src/features/posts/api/models/post.input.model';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';

describe('Blogs bans testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  let newUser: UserOutputModel;
  let newBlogForBan: BlogOutputModel | null = null;
  let newPost: PostOutputModel | null = null;
  let accessToken: any;

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
      .get(Paths.usersSA)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundUsers.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newUser],
    });

    // Log in newUser and create tokens
    const authUserData = {
      loginOrEmail: newUser!.email,
      password: '123456',
    };

    // Create tokens for newUser
    const createAccessToken = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authUserData)
      .expect(HTTP_STATUSES.OK_200);

    accessToken = createAccessToken.body.accessToken;
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
      accessToken,
    );

    newBlogForBan = createBlog.body;

    expect(newBlogForBan).toEqual({
      id: expect.any(String),
      name: createData.name,
      description: createData.description,
      websiteUrl: createData.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
      images: {
        wallpaper: null,
        main: [],
      },
      currentUserSubscriptionStatus: SubscriptionStatus.NONE,
      subscribersCount: 0,
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
      items: [newBlogForBan],
    });
  });

  it('+ POST create post by blogger with correct data', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPost(
      `${Paths.blogsBlogger}/${newBlogForBan!.id}/posts`,
      createData,
      accessToken,
    );

    newPost = createPost.body;

    expect(newPost).toEqual({
      id: expect.any(String),
      title: createData.title,
      shortDescription: createData.shortDescription,
      content: createData.content,
      blogId: expect.any(String),
      blogName: expect.any(String),
      createdAt: expect.any(String),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatuses.NONE,
        newestLikes: [],
      },
      images: {
        main: [],
      },
    });

    const queryData = {
      sortBy: 'blogName',
      sortDirection: 'ASC',
    };

    const foundPosts = await request(server)
      .get(`${Paths.blogsBlogger}/${newBlogForBan!.id}/posts`)
      .auth(accessToken, { type: 'bearer' })
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  it('+ GET (public) all posts for blog with correct data', async () => {
    const foundPosts = await request(server)
      .get(`${Paths.blogs}/${newBlogForBan!.id}/posts`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  it('+ PUT ban blog by admin', async () => {
    const banData = {
      isBanned: true,
    };

    await request(server)
      .put(`${Paths.blogsSA}/${newBlogForBan!.id}/ban`)
      .auth(basicLogin, basicPassword)
      .send(banData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('+ GET (public) all posts for banned blog with correct data', async () => {
    await request(server)
      .get(`${Paths.blogs}/${newBlogForBan!.id}/posts`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
