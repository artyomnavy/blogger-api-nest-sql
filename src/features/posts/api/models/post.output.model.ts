import { ObjectId } from 'mongodb';

export class Post {
  constructor(
    public _id: ObjectId,
    public title: string,
    public shortDescription: string,
    public content: string,
    public blogId: string,
    public blogName: string,
    public createdAt: Date,
    public extendedLikesInfo: {
      likesCount: number;
      dislikesCount: number;
      myStatus: string;
      newestLikes: {
        addedAt: Date;
        userId: string;
        login: string;
      }[];
    },
  ) {}
}

export class NewestLikesModel {
  addedAt: Date;
  userId: string;
  login: string;
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
  _id: ObjectId;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: Date;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: string;
    newestLikes: NewestLikesModel[];
  };
}
