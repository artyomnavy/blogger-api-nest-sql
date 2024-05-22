import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
export const Paths = {
  blogs: '/blogs',
  blogsSA: '/sa/blogs',
  posts: '/posts',
  comments: '/comments',
  users: '/sa/users',
  auth: '/auth',
  security: '/security',
  questions: '/sa/quiz/questions',
  quiz: '/pair-game-quiz/pairs',
  testing: '/testing',
};

export const badId = new ObjectId().toString();

export const badUuid = uuidv4();

export const responseNullData = {
  pagesCount: 0,
  page: 1,
  pageSize: 10,
  totalCount: 0,
  items: [],
};
