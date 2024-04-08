export class Post {
  constructor(
    public id: string,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public createdAt: Date,
  ) {}
}

export class NewestLikesOutputModel {
  addedAt: string;
  userId: string;
  login: string;
}

export class PostOutputModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikesOutputModel[];
  };
}

export class PostModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName?: string;
  createdAt: Date;
}

export class PostMapperModel {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
  newestLikes: {
    addedAt: string;
    userId: string;
    login: string;
  }[];
}
