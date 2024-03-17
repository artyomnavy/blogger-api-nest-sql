import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DeviceSessionModel } from '../api/models/device.output.model';

export type DeviceSessionDocument = HydratedDocument<DeviceSessionModel>;

@Schema()
export class DeviceSession {
  @Prop({ required: true })
  iat: Date;

  @Prop({ required: true })
  exp: Date;

  @Prop({ required: true })
  ip: string;

  @Prop({ required: true })
  deviceId: string;

  @Prop({ required: true })
  deviceName: string;

  @Prop({ required: true })
  userId: string;
}

export const DeviceSessionEntity = SchemaFactory.createForClass(DeviceSession);
