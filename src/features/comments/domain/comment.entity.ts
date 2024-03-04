import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CommentModel } from '../api/models/comment.output.model';

export type CommentDocument = HydratedDocument<CommentModel>;

@Schema()
class CommentatorInfo {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userLogin: string;
}

@Schema()
class LikesInfo {
  @Prop({ required: true })
  likesCount: number;

  @Prop({ required: true })
  dislikesCount: number;

  @Prop({ required: true })
  myStatus: string;
}

@Schema()
export class Comment {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  commentatorInfo: CommentatorInfo;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  postId: string;

  @Prop({ required: true })
  likesInfo: LikesInfo;
}

export const CommentEntity = SchemaFactory.createForClass(Comment);
