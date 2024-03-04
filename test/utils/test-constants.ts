import { ObjectId } from 'mongodb';
export const Paths = {
  blogs: '/blogs',
  posts: '/posts',
  comments: '/comments',
  users: '/sa/users',
  auth: '/auth',
  security: '/security',
  testing: '/testing',
};

export const badId = new ObjectId().toString();

export const responseNullData = {
  pagesCount: 0,
  page: 1,
  pageSize: 10,
  totalCount: 0,
  items: [],
};
