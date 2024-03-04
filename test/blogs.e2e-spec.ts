import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { HTTP_STATUSES, likesStatuses } from '../src/utils';
import { appSettings } from '../src/app.settings';
import { badId, Paths, responseNullData } from './utils/test-constants';
import { CreateAndUpdateBlogModel } from '../src/features/blogs/api/models/blog.input.model';
import { CreateAndUpdatePostModel } from '../src/features/posts/api/models/post.input.model';
import { CreateEntitiesTestManager } from './utils/test-manager';
import {
  basicLogin,
  basicPassword,
} from '../src/features/public/auth/api/auth.constants';

describe('Blogs testing (e2e)', () => {
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

  let newBlog: BlogOutputModel | null = null;
  let newPost: PostOutputModel | null = null;

  it('+ GET all blogs database', async () => {
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

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('- POST does not create blog with incorrect login and password)', async () => {
    const createData = {
      name: 'login',
      description: 'new blog',
      websiteUrl: 'test@blog.com',
    };

    await createEntitiesTestManager.createBlog(
      Paths.blogs,
      createData,
      'wrongLogin',
      'wrongPass',
      HTTP_STATUSES.UNAUTHORIZED_401,
    );

    const foundBlogs = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('- POST does not create blog with incorrect name, description and websiteUrl)', async () => {
    const createData = {
      name: '',
      description: '',
      websiteUrl: '',
    };

    const errorsCreateBlog = await createEntitiesTestManager.createBlog(
      Paths.blogs,
      createData,
      basicLogin,
      basicPassword,
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
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body).toStrictEqual(responseNullData);
  });

  it('+ POST create blog with correct data)', async () => {
    const createData: CreateAndUpdateBlogModel = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogs,
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

  it('- GET all posts by incorrect blogId', async () => {
    const queryData = {
      pageNumber: '',
      pageSize: '',
      sortBy: '',
      sortDirection: '',
    };

    await request(server)
      .get(`${Paths.blogs}/${badId}/posts`)
      .query(queryData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET all posts with correct blogId for blog', async () => {
    const queryData = {
      pageNumber: '',
      pageSize: '',
      sortBy: '',
      sortDirection: '',
    };

    const foundPosts = await request(server)
      .get(`${Paths.blogs}/${newBlog!.id}/posts`)
      .query(queryData)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  it('- POST does not create post with incorrect data for correct blogId)', async () => {
    const createData = {
      title: '',
      shortDescription: '',
      content: '',
    };

    const errorsCreatePostForBlog =
      await createEntitiesTestManager.createPostForBlog(
        `${Paths.blogs}/${newBlog!.id}/posts`,
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

  it('- POST does not create post with correct data for incorrect blogId)', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    await createEntitiesTestManager.createPostForBlog(
      `${Paths.blogs}/${badId}/posts`,
      createData,
      basicLogin,
      basicPassword,
      HTTP_STATUSES.NOT_FOUND_404,
    );

    const foundPosts = await request(server)
      .get(Paths.posts)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual(responseNullData);
  });

  it('+ POST create post with correct data for correct blogId)', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPostForBlog(
      `${Paths.blogs}/${newBlog!.id}/posts`,
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

  it('- GET blog by ID with incorrect id', async () => {
    await request(server)
      .get(`${Paths.blogs}/${badId}`)
      .expect(HTTP_STATUSES.NOT_FOUND_404);
  });

  it('+ GET blog by ID with correct id', async () => {
    const foundBlog = await request(server)
      .get(`${Paths.blogs}/${newBlog!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlog.body).toStrictEqual(newBlog);
  });

  it('- PUT blog by ID with incorrect id', async () => {
    const updateData = {
      name: 'Bad name',
      description: 'Bad description',
      websiteUrl: 'https://badwebsite.com',
    };

    await request(server)
      .put(`${Paths.blogs}/${badId}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

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

  it('- PUT blog by ID with incorrect data', async () => {
    const updateData = { name: '', description: '', websiteUrl: 'bad' };

    const errorsUpdateBlog = await request(server)
      .put(`${Paths.blogs}/${newBlog!.id}`)
      .auth(basicLogin, basicPassword)
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

  it('+ PUT blog by ID with correct data', async () => {
    const updateData: CreateAndUpdateBlogModel = {
      name: 'New blog 2',
      description: 'New description 2',
      websiteUrl: 'https://website2.com',
    };

    await request(server)
      .put(`${Paths.blogs}/${newBlog!.id}`)
      .auth(basicLogin, basicPassword)
      .send(updateData)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundBlogs = await request(server)
      .get(Paths.blogs)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundBlogs.body.items[0]).toEqual({
      ...newBlog,
      name: updateData.name,
      description: updateData.description,
      websiteUrl: updateData.websiteUrl,
    });

    newBlog = foundBlogs.body.items[0];
  });

  it('- DELETE blog by ID with incorrect id', async () => {
    await request(server)
      .delete(`${Paths.blogs}/${badId}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NOT_FOUND_404);

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

  it('+ DELETE blog by ID with correct id', async () => {
    await request(server)
      .delete(`${Paths.blogs}/${newBlog!.id}`)
      .auth(basicLogin, basicPassword)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundBlogs = await request(server)
      .get(Paths.blogs)
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
