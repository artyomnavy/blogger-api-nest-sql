import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { HTTP_STATUSES, likesStatuses } from '../src/utils';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { appSettings } from '../src/app.settings';
import { badId, Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { CommentOutputModel } from '../src/features/comments/api/models/comment.output.model';

describe('Comments testing (e2e)', () => {
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

  let newUser1: UserOutputModel | null = null;
  let newUser2: UserOutputModel | null = null;
  let newPost: PostOutputModel | null = null;
  let newBlog: BlogOutputModel | null = null;
  let newComment: CommentOutputModel | null = null;
  let token1: any = null;
  let token2: any = null;

  // CREATE NEW USER
  it('+ POST create user1 with correct data', async () => {
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

    newUser1 = createUser.body;

    expect(newUser1).toEqual({
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
      items: [newUser1],
    });
  });

  it('+ POST create user2 with correct data', async () => {
    const createData = {
      login: 'FakeUser',
      password: '654321',
      email: 'user@fake.com',
    };

    const createUser = await createEntitiesTestManager.createUserByAdmin(
      Paths.users,
      createData,
      basicLogin,
      basicPassword,
    );

    newUser2 = createUser.body;

    expect(newUser2).toEqual({
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
      totalCount: 2,
      items: [newUser2, newUser1],
    });
  });

  // CREATE NEW BLOG
  it('+ POST create blog with correct data)', async () => {
    const createData = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsSA,
      createData,
      basicLogin,
      basicPassword,
    );

    newBlog = createBlog.body;

    expect(newBlog).toEqual({
      id: expect.any(String),
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
      createdAt: expect.any(String),
      isMembership: false,
    });

    const foundBlogs = await request(server)
      .get(Paths.blogsSA)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newBlog],
    });
  });

  // CREATE NEW POST
  it('+ POST create post with correct data)', async () => {
    const createData = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
      blogId: newBlog!.id,
    };

    const createPost = await createEntitiesTestManager.createPost(
      Paths.posts,
      createData,
      basicLogin,
      basicPassword,
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
        myStatus: likesStatuses.none,
        newestLikes: [],
      },
    });

    const foundPosts = await request(server)
      .get(Paths.posts)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  // CHECK USER AND CREATE TOKEN (JWT)
  it('+ POST enter to system with correct data and create token1', async () => {
    const authData = {
      loginOrEmail: newUser1!.email,
      password: '123456',
    };

    const createToken = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.OK_200);

    token1 = createToken.body.accessToken;
  });

  it('+ POST enter to system with correct data and create token2', async () => {
    const authData = {
      loginOrEmail: newUser2!.email,
      password: '654321',
    };

    const createToken = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authData)
      .expect(HTTP_STATUSES.OK_200);

    token2 = createToken.body.accessToken;
  });

  // CHECK GET COMMENTS FOR POST
  it('- GET comments with incorrect postId', async () => {
    await request(server)
      .get(`${Paths.posts}/${badId}/comments`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET comments with correct postId', async () => {
    const foundComments = await request(server)
      .get(`${Paths.posts}/${newPost!.id}/comments`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundComments.body).toStrictEqual(responseNullData);
  });

  // CHECK CREATE COMMENT FOR POST
  it('- POST does not create comment for post with incorrect token', async () => {
    const createData = { content: "new content for post user's" };
    const badAccessToken = 'wr0ngt0k3n';

    await request(server)
      .post(`${Paths.posts}/${newPost!.id}/comments`)
      .auth(badAccessToken, { type: 'bearer' })
      .send(createData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- POST does not create comment for post with incorrect postId', async () => {
    const createData = { content: "new content for post user's" };

    await request(server)
      .post(`${Paths.posts}/as6da5s7fsd6f5sdf8f7g6fd6sad54/comments`)
      .auth(token1, { type: 'bearer' })
      .send(createData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('- POST does not create comment for post with incorrect comment data', async () => {
    const createData = { content: 'wrong content' };

    await request(server)
      .post(`${Paths.posts}/${newPost!.id}/comments`)
      .auth(token1, { type: 'bearer' })
      .send(createData)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('+ POST create comment for post with correct token and data', async () => {
    const createData = { content: "new content for post user's" };

    const createComment = await request(server)
      .post(`${Paths.posts}/${newPost!.id}/comments`)
      .auth(token1, { type: 'bearer' })
      .send(createData)
      .expect(HTTP_STATUSES.CREATED_201);

    newComment = createComment.body;

    expect(newComment).toEqual({
      id: expect.any(String),
      content: createData.content,
      commentatorInfo: {
        userId: `${newUser1!.id}`,
        userLogin: `${newUser1!.login}`,
      },
      createdAt: expect.any(String),
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: likesStatuses.none,
      },
    });

    const foundComments = await request(server)
      .get(`${Paths.posts}/${newPost!.id}/comments`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundComments.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newComment],
    });
  });

  // CHECK GET, UPDATE AND DELETE COMMENTS BY ID
  it('- GET comment by incorrect id', async () => {
    await request(server)
      .get(`${Paths.comments}/asf56d6sf567dsfg78g87sd`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET comment by correct id', async () => {
    await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .expect(HTTP_STATUSES.OK_200, newComment);
  });

  it('- PUT comment by id with incorrect token', async () => {
    const updateData = { content: "the best new content for post user's" };
    const badAccessToken = 'wr0ngt0k3n';

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}`)
      .auth(badAccessToken, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- PUT comment by id with incorrect commentId', async () => {
    const updateData = { content: "the best new content for post user's" };

    await request(server)
      .put(`${Paths.comments}/hf6345cnvc2b573b5c`)
      .auth(token1, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('- PUT comment by id with incorrect comment data', async () => {
    const updateData = { content: 'wrong content' };

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- PUT comment by id with incorrect userId', async () => {
    const updateData = { content: "the best new content for post user's" };

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}`)
      .auth(token2, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.FORBIDDEN_403);
  });

  it('+ PUT comment by id with correct data', async () => {
    const updateData = { content: "the best new content for post user's" };

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundComments = await request(server)
      .get(`${Paths.posts}/${newPost!.id}/comments`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundComments.body.items[0]).toEqual({
      ...newComment,
      content: updateData.content,
    });

    newComment = foundComments.body.items[0];
  });

  it('- DELETE comment by id with incorrect token', async () => {
    const badAccessToken = 'wr0ngt0k3n';

    await request(server)
      .delete(`${Paths.comments}/${newComment!.id}`)
      .auth(badAccessToken, { type: 'bearer' })
      .expect(HTTP_STATUSES.UNAUTHORIZED_401);
  });

  it('- DELETE comment by id with incorrect commentId', async () => {
    await request(server)
      .delete(`${Paths.comments}/hf6345cnvc2b573b5c`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('- DELETE comment by id with incorrect userId', async () => {
    await request(server)
      .delete(`${Paths.comments}/${newComment!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.FORBIDDEN_403);
  });

  it('+ DELETE comment by id with correct data', async () => {
    await request(server)
      .delete(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.NO_CONTENT_204);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
