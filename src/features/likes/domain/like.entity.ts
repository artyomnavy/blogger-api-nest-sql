import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { LikeModel } from '../api/models/like.output.model';

export type LikeDocument = HydratedDocument<LikeModel>;

@Schema()
export class Like {
  @Prop({ required: true })
  commentIdOrPostId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  addedAt: Date;
}

export const LikeEntity = SchemaFactory.createForClass(Like);
