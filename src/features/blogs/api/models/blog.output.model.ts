import { User } from '../../../users/domain/user.entity';

export class Blog {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: Date,
    public isMembership: boolean,
    public user: User,
  ) {}
}

export class BlogModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
  userId?: string;
  userLogin?: string;
}
export class BlogOutputModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo?: {
    userId: string;
    userLogin: string;
  };
}

export const blogMapper = (blog: BlogModel): BlogOutputModel => {
  const blogOutput: BlogOutputModel = {
    id: blog.id,
    name: blog.name,
    description: blog.description,
    websiteUrl: blog.websiteUrl,
    createdAt: blog.createdAt.toISOString(),
    isMembership: blog.isMembership,
  };

  if (blog.userId && blog.userLogin) {
    blogOutput.blogOwnerInfo = {
      userId: blog.userId,
      userLogin: blog.userLogin,
    };
  }

  return blogOutput;
};
