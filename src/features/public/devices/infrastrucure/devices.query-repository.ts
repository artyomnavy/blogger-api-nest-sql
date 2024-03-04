import {
  deviceSessionMapper,
  DeviceSessionModel,
  DeviceSessionOutputModel,
} from '../api/models/device.output.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession, DeviceSessionDocument } from '../domain/device.entity';
import { Model } from 'mongoose';
import { WithId } from 'mongodb';

@Injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectModel(DeviceSession.name)
    private deviceModel: Model<DeviceSessionDocument>,
  ) {}
  async checkDeviceSession(
    userId: string,
    deviceId: string,
  ): Promise<WithId<DeviceSessionModel> | null> {
    const deviceSession: WithId<DeviceSessionModel> | null =
      await this.deviceModel.findOne({
        userId: userId,
        deviceId: deviceId,
      });

    if (deviceSession) {
      return deviceSession;
    } else {
      return null;
    }
  }
  async getAllDevicesSessionsForUser(
    userId: string,
  ): Promise<DeviceSessionOutputModel[]> {
    const devicesSessions = await this.deviceModel.find({
      userId: userId,
    });

    return devicesSessions.map(deviceSessionMapper);
  }
  async getDeviceSessionById(
    deviceId: string,
  ): Promise<DeviceSessionModel | null> {
    const deviceSession: DeviceSessionModel | null =
      await this.deviceModel.findOne({ deviceId: deviceId });

    if (deviceSession) {
      return deviceSession;
    } else {
      return null;
    }
  }
}
