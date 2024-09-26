import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import {
  HTTP_STATUSES,
  LikeStatuses,
  SubscriptionStatus,
} from '../src/common/utils';
import { Paths } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { TelegramBotAuthLinkOutputModel } from '../src/features/integrations/telegram/api/models/telegram.output.model';
import { TestingModuleBuilder } from '@nestjs/testing';
import { TelegramAdapter } from '../src/features/integrations/telegram/adapters/telegram.adapter';
import { TelegramAdapterMock } from './mock/telegram-adapter.mock';
import { CreateAndUpdatePostModel } from '../src/features/posts/api/models/post.input.model';

describe('Blogs subscriptions with telegram bot testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings(
      (moduleBuilder: TestingModuleBuilder) => {
        moduleBuilder
          .overrideProvider(TelegramAdapter)
          .useClass(TelegramAdapterMock);
      },
    );

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  let newPost: PostOutputModel | null = null;
  let newBlog: BlogOutputModel | null = null;
  let newBlog2: BlogOutputModel | null = null;
  let newBlog3: BlogOutputModel | null = null;
  let newBlog4: BlogOutputModel | null = null;
  let newBlog5: BlogOutputModel | null = null;
  let newBlog6: BlogOutputModel | null = null;
  let user: UserOutputModel;
  let subscriber: UserOutputModel;
  let subscriber2: UserOutputModel;
  let accessTokenUser: any;
  let accessTokenSubscriber: any;
  let accessTokenSubscriber2: any;
  let authBotLink: TelegramBotAuthLinkOutputModel | null = null;
  let telegramText: string | null = null;
  const telegramIdSubscriber: number = 111333888;

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

    // Create subscriber 2
    const subscriberData2 = {
      login: 'sub_test2',
      password: 'qwerty',
      email: 'subscriber2@blog.com',
    };

    const createSubscriber2ByAdmin =
      await createEntitiesTestManager.createUserByAdmin(
        Paths.usersSA,
        subscriberData2,
        basicLogin,
        basicPassword,
      );

    subscriber2 = createSubscriber2ByAdmin.body;

    // Login and create tokens for user and subscriber
    const authUserData = {
      loginOrEmail: user!.email,
      password: userData.password,
    };

    const authSubscriberData = {
      loginOrEmail: subscriber!.email,
      password: subscriberData.password,
    };

    const authSubscriberData2 = {
      loginOrEmail: subscriber2!.email,
      password: subscriberData2.password,
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

    const createAccessTokenForSubscriber2 = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authSubscriberData2)
      .expect(HTTP_STATUSES.OK_200);

    accessTokenSubscriber2 = createAccessTokenForSubscriber2.body.accessToken;
  });

  it('+ POST (blogger) create blog for user with correct data', async () => {
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

    // Create 5 blogs
    const createData2 = {
      name: 'New blog 2',
      description: 'New description 2',
      websiteUrl: 'https://website2.com',
    };

    const createBlog2 = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData2,
      accessTokenUser,
    );

    newBlog2 = createBlog2.body;

    const createData3 = {
      name: 'New blog 3',
      description: 'New description 3',
      websiteUrl: 'https://website3.com',
    };

    const createBlog3 = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData3,
      accessTokenUser,
    );

    newBlog3 = createBlog3.body;

    const createData4 = {
      name: 'New blog 4',
      description: 'New description 4',
      websiteUrl: 'https://website4.com',
    };

    const createBlog4 = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData4,
      accessTokenUser,
    );

    newBlog4 = createBlog4.body;

    const createData5 = {
      name: 'New blog 5',
      description: 'New description 5',
      websiteUrl: 'https://website5.com',
    };

    const createBlog5 = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData5,
      accessTokenUser,
    );

    newBlog5 = createBlog5.body;

    const createData6 = {
      name: 'New blog 6',
      description: 'New description 6',
      websiteUrl: 'https://website6.com',
    };

    const createBlog6 = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData6,
      accessTokenUser,
    );

    newBlog6 = createBlog6.body;

    const foundSixBlogs = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs.body.items.length).toBe(6);

    console.log(
      `test six blogs after create: ${JSON.stringify(foundSixBlogs.body)}`,
    );
  });

  it('+ POST (public) subscribe user to blog with correct data', async () => {
    await request(server)
      .post(`${Paths.blogs}/${newBlog!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundBlogs = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body.items.length).toBe(6);

    // newBlog!.subscribersCount = 1;
    //
    // expect(foundBlogs.body).toStrictEqual({
    //   pagesCount: 1,
    //   page: 1,
    //   pageSize: 10,
    //   totalCount: 1,
    //   items: [newBlog],
    // });

    // Subscriber1 subscribe blogs 3, 5
    await request(server)
      .post(`${Paths.blogs}/${newBlog3!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs2 = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs2.body.items.length).toBe(6);

    await request(server)
      .post(`${Paths.blogs}/${newBlog5!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs3 = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs3.body.items.length).toBe(6);

    console.log(
      `test six blogs after subscribe user2 to blog 1,3,5: ${JSON.stringify(foundSixBlogs3.body)}`,
    );

    // Subscriber2 subscribe blogs 1, 3, 6
    await request(server)
      .post(`${Paths.blogs}/${newBlog!.id}/subscription`)
      .auth(accessTokenSubscriber2, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs4 = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs4.body.items.length).toBe(6);

    await request(server)
      .post(`${Paths.blogs}/${newBlog3!.id}/subscription`)
      .auth(accessTokenSubscriber2, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs6 = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs6.body.items.length).toBe(6);

    await request(server)
      .post(`${Paths.blogs}/${newBlog6!.id}/subscription`)
      .auth(accessTokenSubscriber2, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs7 = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs7.body.items.length).toBe(6);

    console.log(
      `test six blogs after subscribe user3 to blog 1,3,6: ${JSON.stringify(foundSixBlogs7.body)}`,
    );
  });

  it('+ GET telegram bot auth link and create telegramCode subscriber', async () => {
    const generateLink = await request(server)
      .get(`${Paths.telegram}/auth-bot-link`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    authBotLink = generateLink.body;

    telegramText = '/' + authBotLink!.link.split('?')[1].replace('=', ' ');
  });

  it('+ POST add telegramId subscriber by telegram webhook', async () => {
    const telegramPayload = {
      message: {
        from: { id: telegramIdSubscriber },
        text: telegramText,
      },
    };

    await request(server)
      .post(`${Paths.telegram}/webhook`)
      .send(telegramPayload)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('+ POST (blogger) create post for user with correct data', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPost(
      `${Paths.blogsBlogger}/${newBlog!.id}/posts`,
      createData,
      accessTokenUser,
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
      .get(`${Paths.blogsBlogger}/${newBlog!.id}/posts`)
      .auth(accessTokenUser, { type: 'bearer' })
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

  it('+ POST (public) unsubscribe user to blog with correct data', async () => {
    // await request(server)
    //   .delete(`${Paths.blogs}/${newBlog3!.id}/subscription`)
    //   .auth(accessTokenSubscriber, { type: 'bearer' })
    //   .expect(HTTP_STATUSES.NO_CONTENT_204);
    //
    // const foundBlogs = await request(server)
    //   .get(Paths.blogs)
    //   .expect(HTTP_STATUSES.OK_200);
    //
    // newBlog!.subscribersCount = 0;
    //
    // expect(foundBlogs.body).toStrictEqual({
    //   pagesCount: 1,
    //   page: 1,
    //   pageSize: 10,
    //   totalCount: 1,
    //   items: [newBlog],
    // });

    await request(server)
      .delete(`${Paths.blogs}/${newBlog3!.id}/subscription`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundSixBlogs = await request(server)
      .get(Paths.blogs)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundSixBlogs.body.items.length).toBe(6);

    console.log(
      `test six blogs after unsubscribe user2 to blog 3: ${JSON.stringify(foundSixBlogs.body)}`,
    );

    const foundBlogsBlogger = await request(server)
      .get(Paths.blogsBlogger)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    console.log(foundBlogsBlogger.body.items, 'foundBlogsBlogger');
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
    await server.close();
  });
});
