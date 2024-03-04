export class LikeModel {
  commentIdOrPostId: string;
  userId: string;
  status: string;
  addedAt: Date;
}

export class LikeOutputModel {
  commentIdOrPostId: string;
  userId: string;
  status: string;
  addedAt: string;
}
