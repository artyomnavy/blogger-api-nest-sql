import {
  deviceSessionMapper,
  DeviceSessionModel,
  DeviceSessionOutputModel,
} from '../api/models/device.output.model';
import { Injectable } from '@nestjs/common';
import { WithId } from 'mongodb';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DevicesQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async checkDeviceSession(
    userId: string,
    deviceId: string,
  ): Promise<WithId<DeviceSessionModel> | null> {
    const query = `SELECT
                "iat", "exp", "ip", "deviceId", "deviceName", "userId"
                FROM public."Devices"
                WHERE "userId" = $1 AND "deviceId" = $2`;

    const deviceSession = await this.dataSource.query(query, [
      userId,
      deviceId,
    ]);

    if (!deviceSession.length) {
      return null;
    } else {
      return deviceSession[0];
    }
  }
  async getAllDevicesSessionsForUser(
    userId: string,
  ): Promise<DeviceSessionOutputModel[]> {
    const query = `SELECT
                "iat", "exp", "ip", "deviceId", "deviceName", "userId"
                FROM public."Devices"
                WHERE "userId" = $1`;

    const devicesSessions = await this.dataSource.query(query, [userId]);

    return devicesSessions.map(deviceSessionMapper);
  }
  async getDeviceSessionById(
    deviceId: string,
  ): Promise<DeviceSessionModel | null> {
    const query = `SELECT
                "iat", "exp", "ip", "deviceId", "deviceName", "userId"
                FROM public."Devices"
                WHERE "deviceId" = $1`;

    const deviceSession = await this.dataSource.query(query, [deviceId]);

    if (!deviceSession.length) {
      return null;
    } else {
      return deviceSession[0];
    }
  }
}
