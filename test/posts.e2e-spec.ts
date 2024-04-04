import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { HTTP_STATUSES, likesStatuses } from '../src/utils';
import { appSettings } from '../src/app.settings';
import { badId, Paths, responseNullData } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { CreateAndUpdatePostModel } from '../src/features/posts/api/models/post.input.model';

describe('Posts testing (e2e)', () => {
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

  let newPost: PostOutputModel | null = null;
  let newBlog: BlogOutputModel | null = null;

  it('+ GET (public) all posts database', async () => {
    const foundPosts = await request(server)
      .get(Paths.posts)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  it('+ POST (superadmin) create blog with correct data)', async () => {
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
      name: createData.name,
      description: createData.description,
      websiteUrl: createData.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
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

  it('- GET (superadmin) all posts by incorrect blogId', async () => {
    const queryData = {
      pageNumber: '',
      pageSize: '',
      sortBy: '',
      sortDirection: '',
    };

    await request(server)
      .get(`${Paths.blogsSA}/${badId}/posts`)
      .auth(basicLogin, basicPassword)
      .query(queryData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET (superadmin) all posts with correct blogId for blog', async () => {
    const queryData = {
      pageNumber: '',
      pageSize: '',
      sortBy: '',
      sortDirection: '',
    };

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  it('- POST (superadmin) does not create post with incorrect data for correct blogId)', async () => {
    const createData = {
      title: '',
      shortDescription: '',
      content: '',
    };

    const errorsCreatePostForBlog =
      await createEntitiesTestManager.createPostForBlog(
        `${Paths.blogsSA}/${newBlog!.id}/posts`,
        createData,
        basicLogin,
        basicPassword,
        HTTP_STATUSES.BAD_REQUEST_400,
      );

    expect(errorsCreatePostForBlog.body).toStrictEqual({
      errorsMessages: [
        { message: expect.any(String), field: 'title' },
        { message: expect.any(String), field: 'shortDescription' },
        { message: expect.any(String), field: 'content' },
      ],
    });

    const foundPosts = await request(server)
      .get(Paths.posts)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);

    const foundBlog = await request(server)
      .get(`${Paths.blogs}/${newBlog!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlog.body).toStrictEqual(newBlog);
  });

  it('- POST (superadmin) does not create post with correct data for incorrect blogId)', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    await createEntitiesTestManager.createPostForBlog(
      `${Paths.blogsSA}/${badId}/posts`,
      createData,
      basicLogin,
      basicPassword,
      HTTP_STATUSES.NOT_FOUND_404,
    );

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  it('+ POST (superadmin) create post with correct data for correct blogId)', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPostForBlog(
      `${Paths.blogsSA}/${newBlog!.id}/posts`,
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

    const queryData = {
      sortBy: 'blogName',
      sortDirection: 'ASC',
    };

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
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

  it('- GET (public) post by ID with incorrect id', async () => {
    await request(server)
      .get(`${Paths.posts}/${badId}`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET (public) post by ID with correct id', async () => {
    const foundPost = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPost.body).toStrictEqual(newPost);
  });

  it('- PUT (superadmin) post by ID with incorrect id', async () => {
    const updateData = {
      title: 'Bad title',
      shortDescription: 'Bad shortDescription',
      content: 'Bad content',
      blogId: newBlog!.id,
    };

    await request(server)
      .put(`${Paths.blogsSA}/${newBlog!.id}/posts/${badId}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  it('- PUT (superadmin) post by ID with incorrect data', async () => {
    const updateData = {
      title: '',
      shortDescription: '',
      content: '',
      blogId: '',
    };

    const errorsUpdatePost = await request(server)
      .put(`${Paths.blogsSA}/${newBlog!.id}/posts/${newPost!.id}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);

    expect(errorsUpdatePost.body).toStrictEqual({
      errorsMessages: [
        { message: expect.any(String), field: 'title' },
        { message: expect.any(String), field: 'shortDescription' },
        { message: expect.any(String), field: 'content' },
      ],
    });

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  it('+ PUT (superadmin) post by ID with correct data', async () => {
    const updateData = {
      title: 'New post 2',
      shortDescription: 'New shortDescription 2',
      content: 'New content 2',
      blogId: newBlog!.id,
    };

    await request(server)
      .put(`${Paths.blogsSA}/${newBlog!.id}/posts/${newPost!.id}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body.items[0]).toEqual({
      ...newPost,
      title: updateData.title,
      shortDescription: updateData.shortDescription,
      content: updateData.content,
    });
    newPost = foundPosts.body.items[0];
  });

  it('- DELETE (superadmin) post by ID with incorrect id', async () => {
    await request(server)
      .delete(`${Paths.blogsSA}/${newBlog!.id}/posts/${badId}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [newPost],
    });
  });

  it('+ DELETE (superadmin) post by ID with correct id', async () => {
    await request(server)
      .delete(`${Paths.blogsSA}/${newBlog!.id}/posts/${newPost!.id}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPosts = await request(server)
      .get(`${Paths.blogsSA}/${newBlog!.id}/posts`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);
    await server.close();
  });
});
