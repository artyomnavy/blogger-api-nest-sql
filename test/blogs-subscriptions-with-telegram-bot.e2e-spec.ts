import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { HTTP_STATUSES, SubscriptionStatus } from '../src/common/utils';
import { Paths } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';

describe('Blogs subscriptions with telegram bot testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  const newPost: PostOutputModel | null = null;
  let newBlog: BlogOutputModel | null = null;
  let user: UserOutputModel;
  let subscriber: UserOutputModel;
  let accessTokenUser: any;
  let accessTokenSubscriber: any;

  // Create by admin and login user and subscriber
  it('+ POST create by admin and log in user', async () => {
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

    user = createUserByAdmin.body;

    expect(user).toEqual({
      id: expect.any(String),
      login: user.login,
      email: user.email,
      createdAt: expect.any(String),
      banInfo: {
        banDate: null,
        banReason: null,
        isBanned: false,
      },
    });

    // Create subscriber
    const subscriberData = {
      login: 'subscriber',
      password: '654321',
      email: 'subscriber@blog.com',
    };

    const createSubscriberByAdmin =
      await createEntitiesTestManager.createUserByAdmin(
        Paths.usersSA,
        subscriberData,
        basicLogin,
        basicPassword,
      );

    subscriber = createSubscriberByAdmin.body;

    expect(subscriber).toEqual({
      id: expect.any(String),
      login: subscriber.login,
      email: subscriber.email,
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
      items: [subscriber, user],
    });

    // Login and create tokens for user and subscriber
    const authUserData = {
      loginOrEmail: user!.email,
      password: userData.password,
    };

    const authSubscriberData = {
      loginOrEmail: subscriber!.email,
      password: subscriberData.password,
    };

    // Create tokens for user and subscriber
    const createAccessTokenForUser = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authUserData)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenUser = createAccessTokenForUser.body.accessToken;

    const createAccessTokenForSubscriber = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authSubscriberData)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenSubscriber = createAccessTokenForSubscriber.body.accessToken;
  });

  it('+ POST (blogger) create blog for user with correct data)', async () => {
    const createData = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      accessTokenUser,
    );

    newBlog = createBlog.body;

    expect(newBlog).toEqual({
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

    const foundBlogs = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  it('+ POST (public) subscribe user to blog with correct data)', async () => {
    await request(server)
      .post(`${Paths.blogs}/${newBlog!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('+ POST (public) unsubscribe user to blog with correct data)', async () => {
    await request(server)
      .delete(`${Paths.blogs}/${newBlog!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  // it('+ POST (blogger) create post for user with correct data)', async () => {
  //   const createData: CreateAndUpdatePostModel = {
  //     title: 'New post 1',
  //     shortDescription: 'New shortDescription 1',
  //     content: 'New content 1',
  //   };
  //
  //   const createPost = await createEntitiesTestManager.createPost(
  //     `${Paths.blogsBlogger}/${newBlog!.id}/posts`,
  //     createData,
  //     accessTokenUser,
  //   );
  //
  //   newPost = createPost.body;
  //
  //   expect(newPost).toEqual({
  //     id: expect.any(String),
  //     title: createData.title,
  //     shortDescription: createData.shortDescription,
  //     content: createData.content,
  //     blogId: expect.any(String),
  //     blogName: expect.any(String),
  //     createdAt: expect.any(String),
  //     extendedLikesInfo: {
  //       likesCount: 0,
  //       dislikesCount: 0,
  //       myStatus: LikeStatuses.NONE,
  //       newestLikes: [],
  //     },
  //     images: {
  //       main: [],
  //     },
  //   });
  //
  //   const queryData = {
  //     sortBy: 'blogName',
  //     sortDirection: 'ASC',
  //   };
  //
  //   const foundPosts = await request(server)
  //     .get(`${Paths.blogsBlogger}/${newBlog!.id}/posts`)
  //     .auth(accessTokenUser, { type: 'bearer' })
  //     .query(queryData)
  //     .expect(HTTP_STATUSES.OK_200);
  //
  //   expect(foundPosts.body).toStrictEqual({
  //     pagesCount: 1,
  //     page: 1,
  //     pageSize: 10,
  //     totalCount: 1,
  //     items: [newPost],
  //   });
  // });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
    await server.close();
  });
});
