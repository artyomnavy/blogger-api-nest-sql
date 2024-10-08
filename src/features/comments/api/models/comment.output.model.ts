export class CommentModel {
  id: string;
  content: string;
  userId: string;
  createdAt: Date;
  postId: string;
}

export class CommentOutputModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
}

export class CommentOutputForBloggerModel {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  createdAt: string;
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
  };
  postInfo: {
    id: string;
    title: string;
    blogId: string;
    blogName: string;
  };
}

export class Comment {
  constructor(
    public id: string,
    public content: string,
    public userId: string,
    public createdAt: Date,
    public postId: string,
  ) {}
}

export class CommentMapperModel {
  id: string;
  content: string;
  userId: string;
  userLogin: string;
  createdAt: Date;
  likesCount: string;
  dislikesCount: string;
  myStatus: string;
}

export class CommentMapperModelForBlogger {
  id: string;
  content: string;
  userId: string;
  userLogin: string;
  createdAt: Date;
  likesCount: string;
  dislikesCount: string;
  myStatus: string;
  postId: string;
  postTitle: string;
  blogId: string;
  blogName: string;
}
