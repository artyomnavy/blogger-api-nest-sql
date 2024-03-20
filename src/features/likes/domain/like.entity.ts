import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// export type LikeDocument = HydratedDocument<>;

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
