import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HTTP_STATUSES } from '../src/common/utils';
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
import { BlogWallpaper } from '../src/features/files/domain/wallpaper-blog.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { checkFileExists, deleteEmptyFolders } from './utils/test-image-utils';

describe('Images testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;
  let blogWallpaperEntity: Repository<BlogWallpaper>;

  let newUser: UserOutputModel;
  let newBlog: BlogOutputModel | null = null;
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

    expect(uploadImage.body.wallpaper.url).toContain(
      `/views/blogs/${newBlog!.id}/wallpapers/+blog_wallpaper.png`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      '+blog_wallpaper.png',
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

    expect(uploadImage.body.wallpaper.url).toContain(
      `/views/blogs/${newBlog!.id}/wallpapers/+blog_wallpaper.jpeg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      '+blog_wallpaper.jpeg',
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

    expect(uploadImage.body.wallpaper.url).toContain(
      `/views/blogs/${newBlog!.id}/wallpapers/+blog_wallpaper.jpg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'wallpapers',
      '+blog_wallpaper.jpg',
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
      `/views/blogs/${newBlog!.id}/main/+blog_main.png`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      '+blog_main.png',
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
      `/views/blogs/${newBlog!.id}/main/+blog_main.jpeg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      '+blog_main.jpeg',
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
      `/views/blogs/${newBlog!.id}/main/+blog_main.jpg`,
    );

    const uploadedImagePath = join(
      __dirname,
      'views',
      'blogs',
      newBlog!.id,
      'main',
      '+blog_main.jpg',
    );

    const isExistImage = await checkFileExists(uploadedImagePath);

    expect(isExistImage).toBeTruthy();

    await unlink(uploadedImagePath);
  });

  afterAll(async () => {
    await deleteEmptyFolders(join(__dirname, 'views'));

    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
