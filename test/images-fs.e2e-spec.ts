import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  HTTP_STATUSES,
  LikeStatuses,
  SubscriptionStatuses,
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
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { Repository } from 'typeorm';
import { BlogWallpaper } from '../src/features/files/images/domain/wallpaper-blog.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { checkFileExists, deleteEmptyFolders } from './utils/test-image-utils';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { CreateAndUpdatePostModel } from '../src/features/posts/api/models/post.input.model';

// Перед запуском необходимо расскомментировать в контроллерах
// BlogsBloggerController, PostsController и BlogsPublicController
// код для работы с file storage adapter

describe('Images fs testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let blogWallpaperEntity: Repository<BlogWallpaper>;

  let newUser: UserOutputModel;
  let newBlog: BlogOutputModel | null = null;
  let newPost: PostOutputModel | null = null;
  let accessToken: any;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;

    blogWallpaperEntity = app.get(getRepositoryToken(BlogWallpaper));
  });

  // Create by admin and log in newUser
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

    newUser = createUserByAdmin.body;

    expect(newUser).toEqual({
      id: expect.any(String),
      login: newUser.login,
      email: newUser.email,
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
    const createAccessTokenForUser = await request(server)
      .post(`${Paths.auth}/login`)
      .send(authUserData)
      .expect(HTTP_STATUSES.OK_200);

    accessToken = createAccessTokenForUser.body.accessToken;
  });

  // Create new blog

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
      currentUserSubscriptionStatus: SubscriptionStatuses.NONE,
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
      items: [newBlog],
    });
  });

  // Create new post

  it('+ POST (blogger) create post with correct data for correct blogId)', async () => {
    const createData: CreateAndUpdatePostModel = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPost(
      `${Paths.blogsBlogger}/${newBlog!.id}/posts`,
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
      .get(`${Paths.blogsBlogger}/${newBlog!.id}/posts`)
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

  // CHECK UPLOAD BLOG WALLPAPER

  it('- POST upload to fs wallpaper for blog with incorrect width', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-width_blog_wallpaper.png',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs wallpaper for blog with incorrect height', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-height_blog_wallpaper.png',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs wallpaper for blog with incorrect type svg', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-type_blog_wallpaper.svg',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs wallpaper for blog with incorrect size', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-size_blog_wallpaper.jpg',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('+ POST upload to fs wallpaper png type for blog', async () => {
    const testImagePath = join(__dirname, 'test-images', '+blog_wallpaper.png');

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.wallpaper.url).toMatch(
      new RegExp(`/views/blogs/${newBlog!.id}/wallpapers/.*\\.png$`),
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      `${newBlog!.id}_+blog_wallpaper.png`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();
  });

  it('+ POST upload to fs wallpaper jpeg type for blog', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '+blog_wallpaper.jpeg',
    );

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.wallpaper.url).toMatch(
      new RegExp(`/views/blogs/${newBlog!.id}/wallpapers/.*\\.jpeg$`),
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      `${newBlog!.id}_+blog_wallpaper.jpeg`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();
  });

  it('+ POST upload to fs wallpaper jpg type for blog', async () => {
    const testImagePath = join(__dirname, 'test-images', '+blog_wallpaper.jpg');

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/wallpaper`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.wallpaper.url).toMatch(
      new RegExp(`/views/blogs/${newBlog!.id}/wallpapers/.*\\.jpg$`),
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      `${newBlog!.id}_+blog_wallpaper.jpg`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();

    await unlink(uploadedImagePath);

    await blogWallpaperEntity
      .createQueryBuilder()
      .delete()
      .from(BlogWallpaper)
      .execute();
  });

  // CHECK UPLOAD BLOG MAIN IMAGE

  it('- POST upload to fs main image for blog with incorrect width', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-width_blog_main.png',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs main image for blog with incorrect height', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-height_blog_main.png',
    );

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs main image for blog with incorrect type svg', async () => {
    const testImagePath = join(__dirname, 'test-images', '-type_blog_main.svg');

    await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('+ POST upload to fs main image png type for blog', async () => {
    const testImagePath = join(__dirname, 'test-images', '+blog_main.png');

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[0].url).toContain(
      `/views/blogs/${newBlog!.id}/main/${newBlog!.id}_+blog_main.png`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      `${newBlog!.id}_+blog_main.png`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();

    await unlink(uploadedImagePath);
  });

  it('+ POST upload to fs main image jpeg type for blog', async () => {
    const testImagePath = join(__dirname, 'test-images', '+blog_main.jpeg');

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[1].url).toContain(
      `/views/blogs/${newBlog!.id}/main/${newBlog!.id}_+blog_main.jpeg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      `${newBlog!.id}_+blog_main.jpeg`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();

    await unlink(uploadedImagePath);
  });

  it('+ POST upload to fs main image jpg type for blog', async () => {
    const testImagePath = join(__dirname, 'test-images', '+blog_main.jpg');

    const uploadImage = await request(server)
      .post(`${Paths.blogsBlogger}/${newBlog!.id}/images/main`)
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[2].url).toContain(
      `/views/blogs/${newBlog!.id}/main/${newBlog!.id}_+blog_main.jpg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      `${newBlog!.id}_+blog_main.jpg`,
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();

    await unlink(uploadedImagePath);
  });

  // CHECK UPLOAD POST MAIN IMAGE

  it('- POST upload to fs main image for post with incorrect width', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-width_post_main.png',
    );

    await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs main image for post with incorrect height', async () => {
    const testImagePath = join(
      __dirname,
      'test-images',
      '-height_post_main.png',
    );

    await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs main image for post with incorrect type svg', async () => {
    const testImagePath = join(__dirname, 'test-images', '-type_post_main.svg');

    await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('- POST upload to fs main image for post with incorrect size', async () => {
    const testImagePath = join(__dirname, 'test-images', '-size_post_main.jpg');

    await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  it('+ POST upload to fs main image png type for post', async () => {
    const testImagePath = join(__dirname, 'test-images', '+post_main.png');

    const uploadImage = await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[0].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_+post_main.png`,
    );

    expect(uploadImage.body.main[1].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_middle_+post_main.png`,
    );

    expect(uploadImage.body.main[2].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_small_+post_main.png`,
    );

    const originalImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_+post_main.png`,
    );

    const middleImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_middle_+post_main.png`,
    );

    const smallImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_small_+post_main.png`,
    );

    const isExistOriginalImage = await checkFileExists(originalImagePath);
    const isExistMiddleImage = await checkFileExists(middleImagePath);
    const isExistSmallImage = await checkFileExists(smallImagePath);

    expect(isExistOriginalImage).toBeTruthy();
    expect(isExistMiddleImage).toBeTruthy();
    expect(isExistSmallImage).toBeTruthy();

    await unlink(originalImagePath);
    await unlink(middleImagePath);
    await unlink(smallImagePath);
  });

  it('+ POST upload to fs main image jpeg type for post', async () => {
    const testImagePath = join(__dirname, 'test-images', '+post_main.jpeg');

    const uploadImage = await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[0].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_+post_main.jpeg`,
    );

    expect(uploadImage.body.main[1].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_middle_+post_main.jpeg`,
    );

    expect(uploadImage.body.main[2].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_small_+post_main.jpeg`,
    );

    const originalImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_+post_main.jpeg`,
    );

    const middleImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_middle_+post_main.jpeg`,
    );

    const smallImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_small_+post_main.jpeg`,
    );

    const isExistOriginalImage = await checkFileExists(originalImagePath);
    const isExistMiddleImage = await checkFileExists(middleImagePath);
    const isExistSmallImage = await checkFileExists(smallImagePath);

    expect(isExistOriginalImage).toBeTruthy();
    expect(isExistMiddleImage).toBeTruthy();
    expect(isExistSmallImage).toBeTruthy();

    await unlink(originalImagePath);
    await unlink(middleImagePath);
    await unlink(smallImagePath);
  });

  it('+ POST upload to fs main image jpg type for post', async () => {
    const testImagePath = join(__dirname, 'test-images', '+post_main.jpg');

    const uploadImage = await request(server)
      .post(
        `${Paths.blogsBlogger}/${newBlog!.id}/posts/${newPost!.id}/images/main`,
      )
      .auth(accessToken, { type: 'bearer' })
      .attach('file', testImagePath)
      .expect(HTTP_STATUSES.CREATED_201);

    expect(uploadImage.body.main[0].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_+post_main.jpg`,
    );

    expect(uploadImage.body.main[1].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_middle_+post_main.jpg`,
    );

    expect(uploadImage.body.main[2].url).toContain(
      `/views/posts/${newPost!.id}/main/${newPost!.id}_small_+post_main.jpg`,
    );

    const originalImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_+post_main.jpg`,
    );

    const middleImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_middle_+post_main.jpg`,
    );

    const smallImagePath = join(
      __dirname,
      'views',
      'posts',
      newPost!.id,
      'main',
      `${newPost!.id}_small_+post_main.jpg`,
    );

    const isExistOriginalImage = await checkFileExists(originalImagePath);
    const isExistMiddleImage = await checkFileExists(middleImagePath);
    const isExistSmallImage = await checkFileExists(smallImagePath);

    expect(isExistOriginalImage).toBeTruthy();
    expect(isExistMiddleImage).toBeTruthy();
    expect(isExistSmallImage).toBeTruthy();

    await unlink(originalImagePath);
    await unlink(middleImagePath);
    await unlink(smallImagePath);
  });

  afterAll(async () => {
    await deleteEmptyFolders(join(__dirname, 'views'));

    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
