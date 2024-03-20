export class LikeCommentModel {
  id: string;
  commentId: string;
  userId: string;
  status: string;
  addedAt: Date;
}

export class LikeCommentOutputModel {
  id: string;
  commentId: string;
  userId: string;
  status: string;
  addedAt: string;
}

export class LikeComment {
  constructor(
    public id: string,
    public commentId: string,
    public userId: string,
    public status: string,
    public addedAt: Date,
  ) {}
}
