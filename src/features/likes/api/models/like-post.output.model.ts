export class LikePostModel {
  id: string;
  postId: string;
  userId: string;
  status: string;
  addedAt: Date;
}

export class LikePostOutputModel {
  id: string;
  postId: string;
  userId: string;
  status: string;
  addedAt: string;
}

export class LikePost {
  constructor(
    public id: string,
    public postId: string,
    public userId: string,
    public status: string,
    public addedAt: Date,
  ) {}
}
