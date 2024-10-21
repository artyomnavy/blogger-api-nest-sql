import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import {
  Currency,
  HTTP_STATUSES,
  MembershipsPlans,
  SubscriptionStatus,
} from '../src/common/utils';
import { Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { TestingModuleBuilder } from '@nestjs/testing';
import { TelegramAdapter } from '../src/features/integrations/telegram/adapters/telegram.adapter';
import { TelegramAdapterMock } from './mock/telegram-adapter.mock';
import { BlogMembershipPlan } from '../src/features/memberships/domain/blog-membership-plan.entity';
import { StripeAdapter } from '../src/features/integrations/payments/adapters/stripe-adapter';
import { StripeAdapterMock } from './mock/stripe-adapter.mock';
import { Repository } from 'typeorm';
import { PaymentBlogMembership } from '../src/features/integrations/payments/domain/payment-blog-membership.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('Blogs memberships with payments testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let paymentEntity: Repository<PaymentBlogMembership>;

  beforeAll(async () => {
    const testSettings = await initSettings(
      (moduleBuilder: TestingModuleBuilder) => {
        moduleBuilder
          .overrideProvider(TelegramAdapter)
          .useClass(TelegramAdapterMock)
          .overrideProvider(StripeAdapter)
          .useClass(StripeAdapterMock);
      },
    );

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;

    paymentEntity = testSettings.app.get(
      getRepositoryToken(PaymentBlogMembership),
    );
  });

  let newBlog: BlogOutputModel | null = null;
  let user: UserOutputModel;
  let subscriber: UserOutputModel;
  let accessTokenUser: any;
  let accessTokenSubscriber: any;
  let membershipPlanMonthly: BlogMembershipPlan;
  let membershipPlanQuarterly: BlogMembershipPlan;

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
  });

  // Create memberships plans for blog before change isMembership
  it('+ POST (blogger) create blog membership plan', async () => {
    const createDataForMonthlyPlan = {
      planName: MembershipsPlans.MONTHLY,
      price: 10,
      currency: Currency.USD,
    };

    const createPlanMonthly =
      await createEntitiesTestManager.createMembershipPlan(
        `${Paths.blogsBlogger}/${newBlog!.id}/membership/plan`,
        createDataForMonthlyPlan,
        accessTokenUser,
      );

    membershipPlanMonthly = createPlanMonthly.body;

    const createDataForQuarterlyPlan = {
      planName: MembershipsPlans.QUARTERLY,
      price: 25,
      currency: Currency.USD,
    };

    const createPlanQuarterly =
      await createEntitiesTestManager.createMembershipPlan(
        `${Paths.blogsBlogger}/${newBlog!.id}/membership/plan`,
        createDataForQuarterlyPlan,
        accessTokenUser,
      );

    membershipPlanQuarterly = createPlanQuarterly.body;

    const createDataForSemiAnnualPlan = {
      planName: MembershipsPlans.SEMI_ANNUAL,
      price: 50,
      currency: Currency.USD,
    };

    const createPlanSemiAnnual =
      await createEntitiesTestManager.createMembershipPlan(
        `${Paths.blogsBlogger}/${newBlog!.id}/membership/plan`,
        createDataForSemiAnnualPlan,
        accessTokenUser,
      );

    const createDataForAnnualPlan = {
      planName: MembershipsPlans.ANNUAL,
      price: 100,
      currency: Currency.USD,
    };

    const createPlanAnnual =
      await createEntitiesTestManager.createMembershipPlan(
        `${Paths.blogsBlogger}/${newBlog!.id}/membership/plan`,
        createDataForAnnualPlan,
        accessTokenUser,
      );

    const membershipsPlans = await request(server)
      .get(`${Paths.blogs}/${newBlog!.id}/membership/plans`)
      .expect(HTTP_STATUSES.OK_200);

    expect(membershipsPlans.body[0].id).toBe(createPlanMonthly.body.id);
    expect(membershipsPlans.body[1].id).toBe(createPlanQuarterly.body.id);
    expect(membershipsPlans.body[2].id).toBe(createPlanSemiAnnual.body.id);
    expect(membershipsPlans.body[3].id).toBe(createPlanAnnual.body.id);
  });

  it('+ PUT (blogger) update membership blog', async () => {
    const updateData = {
      isMembership: true,
    };

    await request(server)
      .put(`${Paths.blogsBlogger}/${newBlog!.id}/membership`)
      .auth(accessTokenUser, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    newBlog!.isMembership = true;

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

  // CHECK FINISH PAYMENT
  // Generate url for buy membership monthly plan and subscribe user to blog
  it('+ POST (public) generate url for buy subscription to blog with monthly plan', async () => {
    const buyData = {
      membershipPlanId: membershipPlanMonthly.id,
    };

    await request(server)
      .post(`${Paths.blogs}/${newBlog!.id}/membership`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .send(buyData)
      .expect(HTTP_STATUSES.OK_200);
  });

  // TO DO: fix mock return data type Buffer and incorrect test finish use case
  it('+ POST finish payment and subscribe user to blog (stripe session completed)', async () => {
    const payment = await paymentEntity
      .createQueryBuilder('pbm')
      .leftJoinAndSelect('pbm.blogMembershipPlan', 'bmp')
      .where('bmp.id = :membershipPlanId', {
        membershipPlanId: membershipPlanMonthly.id,
      })
      .getOne();

    const rawData = {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: payment!.id,
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(rawData));

    const signature = `test_completed_${payment!.id}`;

    await request(server)
      .post(`${Paths.stripe}/webhook`)
      .set('stripe-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawBody)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  it('+ GET (blogger) all payments blog membership', async () => {
    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundPayments = await request(server)
      .get(`${Paths.usersBlogger}/blog/${newBlog!.id}/payments`)
      .query(queryData)
      .auth(accessTokenUser, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPayments.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          userId: subscriber.id,
          userLogin: subscriber.login,
          blogId: newBlog!.id,
          blogTitle: newBlog!.name,
          membershipPlan: {
            id: membershipPlanMonthly.id,
            monthsCount: membershipPlanMonthly.monthsCount,
            price: membershipPlanMonthly.price,
            currency: membershipPlanMonthly.currency,
          },
        },
      ],
    });
  });

  // CHECK EXPIRED (DELETE) PAYMENT
  // Generate url for buy membership quarterly plan and subscribe user to blog
  it('+ POST (public) generate url for buy subscription to blog with monthly plan', async () => {
    const buyData = {
      membershipPlanId: membershipPlanQuarterly.id,
    };

    await request(server)
      .post(`${Paths.blogs}/${newBlog!.id}/membership`)
      .auth(accessTokenSubscriber, { type: 'bearer' })
      .send(buyData)
      .expect(HTTP_STATUSES.OK_200);
  });

  it('+ POST delete payment and unsubscribe or delete subscription user to blog (stripe session expired)', async () => {
    const payment = await paymentEntity
      .createQueryBuilder('pbm')
      .leftJoinAndSelect('pbm.blogMembershipPlan', 'bmp')
      .where('bmp.id = :membershipPlanId', {
        membershipPlanId: membershipPlanQuarterly.id,
      })
      .getOne();

    const rawData = {
      type: 'checkout.session.expired',
      data: {
        object: {
          client_reference_id: payment!.id,
        },
      },
    };

    const rawBody = Buffer.from(JSON.stringify(rawData));

    const signature = `test_expired_${payment!.id}`;

    await request(server)
      .post(`${Paths.stripe}/webhook`)
      .set('stripe-signature', signature)
      .set('Content-Type', 'application/json')
      .send(rawBody)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  // TO DO: fix and test response payments
  it('+ GET (blogger) all payments blog membership', async () => {
    const queryData = {
      searchNameTerm: '',
      sortBy: '',
      sortDirection: '',
      pageNumber: '',
      pageSize: '',
    };

    const foundPayments = await request(server)
      .get(`${Paths.usersBlogger}/blog/${newBlog!.id}/payments`)
      .query(queryData)
      .auth(accessTokenUser, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    console.log(foundPayments.body);

    // expect(foundPayments.body).toStrictEqual({
    //   pagesCount: 1,
    //   page: 1,
    //   pageSize: 10,
    //   totalCount: 1,
    //   items: expect(foundPayments.body.item.length).toBe(1),
    // });
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
    await server.close();
  });
});
