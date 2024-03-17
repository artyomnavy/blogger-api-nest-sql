import request from 'supertest';
import { HTTP_STATUSES, HttpStatusType } from '../../src/utils';
import { CreateAndUpdateBlogModel } from '../../src/features/blogs/api/models/blog.input.model';
import { CreateAndUpdatePostModel } from '../../src/features/posts/api/models/post.input.model';
import { CreateUserModel } from '../../src/features/users/api/models/user.input.model';
import { INestApplication } from '@nestjs/common';

export class CreateEntitiesTestManager {
  constructor(protected readonly app: INestApplication) {}
  async createBlog(
    uri: string,
    createData: CreateAndUpdateBlogModel,
    login: string,
    password: string,
    statusCode: HttpStatusType = HTTP_STATUSES.CREATED_201,
  ) {
    const response = await request(this.app.getHttpServer())
      .post(uri)
      .auth(login, password)
      .send(createData)
      .expect(statusCode);

    return response;
  }
  async createPostForBlog(
    uri: string,
    createData: CreateAndUpdatePostModel,
    login: string,
    password: string,
    statusCode: HttpStatusType = HTTP_STATUSES.CREATED_201,
  ) {
    const response = await request(this.app.getHttpServer())
      .post(uri)
      .auth(login, password)
      .send(createData)
      .expect(statusCode);

    return response;
  }
  async createPost(
    uri: string,
    createData: CreateAndUpdatePostModel,
    login: string,
    password: string,
    statusCode: HttpStatusType = HTTP_STATUSES.CREATED_201,
  ) {
    const response = await request(this.app.getHttpServer())
      .post(uri)
      .auth(login, password)
      .send(createData)
      .expect(statusCode);

    return response;
  }
  async createUserByAdmin(
    uri: string,
    createData: CreateUserModel,
    basicLogin: string,
    basicPassword: string,
    statusCode: HttpStatusType = HTTP_STATUSES.CREATED_201,
  ) {
    const response = await request(this.app.getHttpServer())
      .post(uri)
      .auth(basicLogin, basicPassword)
      .send(createData)
      .expect(statusCode);

    return response;
  }
  async createUserByRegistration(
    uri: string,
    createData: CreateUserModel,
    statusCode: HttpStatusType = HTTP_STATUSES.NO_CONTENT_204,
  ) {
    const response = await request(this.app.getHttpServer())
      .post(uri)
      .send(createData)
      .expect(statusCode);

    return response;
  }
}
