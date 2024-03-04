import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PostModel } from '../api/models/post.output.model';

export type PostDocument = HydratedDocument<PostModel>;

@Schema()
class NewestLikes {
  @Prop({ required: true })
  addedAt: Date;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  login: string;
}

@Schema()
class ExtendedLikesInfo {
  @Prop({ required: true })
  likesCount: number;

  @Prop({ required: true })
  dislikesCount: number;

  @Prop({ required: true })
  myStatus: string;

  @Prop({ required: true })
  newestLikes: NewestLikes[];
}

@Schema()
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  blogId: string;

  @Prop({ required: true })
  blogName: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  extendedLikesInfo: ExtendedLikesInfo;
}

export const PostEntity = SchemaFactory.createForClass(Post);
