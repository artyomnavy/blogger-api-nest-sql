import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HTTP_STATUSES, LikeStatuses } from '../src/common/utils';
import { Paths } from './utils/test-constants';
import { CreateEntitiesTestManager } from './utils/test-manager';
import { UserOutputModel } from '../src/features/users/api/models/user.output.model';
import { PostOutputModel } from '../src/features/posts/api/models/post.output.model';
import { BlogOutputModel } from '../src/features/blogs/api/models/blog.output.model';
import { CommentOutputModel } from '../src/features/comments/api/models/comment.output.model';
import {
  basicLogin,
  basicPassword,
} from '../src/features/auth/api/auth.constants';
import { initSettings } from './utils/init-settings';

describe('Likes testing (e2e)', () => {
  let app: INestApplication;
  let server;
  let createEntitiesTestManager: CreateEntitiesTestManager;

  beforeAll(async () => {
    const testSettings = await initSettings();

    app = testSettings.app;
    server = testSettings.server;
    createEntitiesTestManager = testSettings.createEntitiesTestManager;
  });

  let newUser1: UserOutputModel | null = null;
  let newUser2: UserOutputModel | null = null;
  let token1: any = null;
  let token2: any = null;
  let newPost: PostOutputModel | null = null;
  let newBlog: BlogOutputModel | null = null;
  let newComment: CommentOutputModel | null = null;

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
      banInfo: {
        banDate: null,
        banReason: null,
        isBanned: false,
      },
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
      banInfo: {
        banDate: null,
        banReason: null,
        isBanned: false,
      },
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

  // CREATE NEW BLOG
  it('+ POST (blogger) create blog by user1 with correct data', async () => {
    const createData = {
      name: 'New blog 1',
      description: 'New description 1',
      websiteUrl: 'https://website1.com',
    };

    const createBlog = await createEntitiesTestManager.createBlog(
      Paths.blogsBlogger,
      createData,
      token1,
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

  // CREATE NEW POST
  it('+ POST (blogger) create post with correct data', async () => {
    const createData = {
      title: 'New post 1',
      shortDescription: 'New shortDescription 1',
      content: 'New content 1',
    };

    const createPost = await createEntitiesTestManager.createPost(
      `${Paths.blogsBlogger}/${newBlog!.id}/posts`,
      createData,
      token1,
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

  // CREATE COMMENT FOR POST
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
        myStatus: LikeStatuses.NONE,
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

  // CHECK PUT LIKES COMMENTS
  it('- PUT change like status comment for user with incorrect status', async () => {
    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: 'badStatus',
      })
      .expect(HTTP_STATUSES.BAD_REQUEST_400);
  });

  // check change like status comment for newUser1
  it('+ PUT change like status comment for user with correct data', async () => {
    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({ likeStatus: LikeStatuses.NONE })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus1ByUser1 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus1ByUser1.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        myStatus: LikeStatuses.NONE,
      },
    });

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.LIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus2ByUser1 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus2ByUser1.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 1,
        myStatus: LikeStatuses.LIKE,
      },
    });

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus3ByUser1 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus3ByUser1.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.DISLIKE,
      },
    });

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus4ByUser1 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus4ByUser1.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.DISLIKE,
      },
    });
  });

  // check change like status comment for newUser2
  it('+ PUT change like status comment for other user with correct data', async () => {
    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.NONE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus1ByUser2 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus1ByUser2.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.NONE,
      },
    });

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.LIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus2ByUser2 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus2ByUser2.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 1,
        dislikesCount: 1,
        myStatus: LikeStatuses.LIKE,
      },
    });

    await request(server)
      .put(`${Paths.comments}/${newComment!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const commentStatus3ByUser2 = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(commentStatus3ByUser2.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        dislikesCount: 2,
        myStatus: LikeStatuses.DISLIKE,
      },
    });
  });

  // GET COMMENTS VISITOR
  it('+ GET comment for visitor with correct data', async () => {
    const foundComment = await request(server)
      .get(`${Paths.comments}/${newComment!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundComment.body).toStrictEqual({
      ...newComment,
      commentatorInfo: { ...newComment!.commentatorInfo },
      likesInfo: {
        ...newComment!.likesInfo,
        likesCount: 0,
        dislikesCount: 2,
        myStatus: LikeStatuses.NONE,
      },
    });
  });

  it("+ GET all comments post's for visitor with correct data", async () => {
    const foundComments = await request(server)
      .get(`${Paths.posts}/${newPost!.id}/comments`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundComments.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          ...newComment,
          commentatorInfo: { ...newComment!.commentatorInfo },
          likesInfo: {
            ...newComment!.likesInfo,
            likesCount: 0,
            dislikesCount: 2,
            myStatus: LikeStatuses.NONE,
          },
        },
      ],
    });
  });

  // CHECK PUT LIKES POSTS

  // check change like status post for newUser1
  it('+ PUT change like status post for user with correct data', async () => {
    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.NONE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike1 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike1.body).toStrictEqual({
      ...newPost,
      extendedLikesInfo: {
        ...newPost!.extendedLikesInfo,
        newestLikes: [],
      },
    });

    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.LIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike2 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike2.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 1,
        dislikesCount: 0,
        myStatus: LikeStatuses.LIKE,
        newestLikes: [
          {
            addedAt: expect.any(String),
            userId: newUser1!.id,
            login: newUser1!.login,
          },
        ],
      },
    });

    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike3 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike3.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.DISLIKE,
        newestLikes: [],
      },
    });

    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token1, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike4 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token1, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike4.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.DISLIKE,
        newestLikes: [],
      },
    });
  });

  // check change like status post for newUser2
  it('+ PUT change like status post for other user with correct data', async () => {
    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.NONE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike5 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike5.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatuses.NONE,
        newestLikes: [],
      },
    });

    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.LIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike6 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike6.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 1,
        dislikesCount: 1,
        myStatus: LikeStatuses.LIKE,
        newestLikes: [
          {
            addedAt: expect.any(String),
            userId: newUser2!.id,
            login: newUser2!.login,
          },
        ],
      },
    });

    await request(server)
      .put(`${Paths.posts}/${newPost!.id}/like-status`)
      .auth(token2, { type: 'bearer' })
      .send({
        likeStatus: LikeStatuses.DISLIKE,
      })
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    const foundPostNewestLike7 = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .auth(token2, { type: 'bearer' })
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPostNewestLike7.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 2,
        myStatus: LikeStatuses.DISLIKE,
        newestLikes: [],
      },
    });
  });

  // GET COMMENTS VISITOR
  it('+ GET post for visitor with correct data', async () => {
    const foundPost = await request(server)
      .get(`${Paths.posts}/${newPost!.id}`)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPost.body).toStrictEqual({
      id: newPost!.id,
      title: newPost!.title,
      shortDescription: newPost!.shortDescription,
      content: newPost!.content,
      blogId: newBlog!.id,
      blogName: newBlog!.name,
      createdAt: newPost!.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 2,
        myStatus: LikeStatuses.NONE,
        newestLikes: [],
      },
    });
  });

  it('+ GET all posts for visitor with correct data', async () => {
    const foundPosts = await request(server)
      .get(Paths.posts)
      .expect(HTTP_STATUSES.OK_200);

    expect(foundPosts.body).toStrictEqual({
      pagesCount: 1,
      page: 1,
      pageSize: 10,
      totalCount: 1,
      items: [
        {
          id: newPost!.id,
          title: newPost!.title,
          shortDescription: newPost!.shortDescription,
          content: newPost!.content,
          blogId: newBlog!.id,
          blogName: newBlog!.name,
          createdAt: newPost!.createdAt,
          extendedLikesInfo: {
            likesCount: 0,
            dislikesCount: 2,
            myStatus: LikeStatuses.NONE,
            newestLikes: [],
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await request(server)
      .delete(`${Paths.testing}/all-data`)
      .expect(HTTP_STATUSES.NO_CONTENT_204);

    await server.close();
  });
});
