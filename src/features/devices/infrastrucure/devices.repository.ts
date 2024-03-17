import { Injectable } from '@nestjs/common';
import { DeviceSessionModel } from '../api/models/device.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DevicesRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createDeviceSession(
    newDeviceSession: DeviceSessionModel,
  ): Promise<DeviceSessionModel> {
    const query = `INSERT INTO public."Devices"(
            "iat", "exp", "ip", "deviceId", "deviceName", "userId")
            VALUES ($1, $2, $3, $4, $5, $6)`;

    await this.dataSource.query(query, [
      newDeviceSession.iat,
      newDeviceSession.exp,
      newDeviceSession.ip,
      newDeviceSession.deviceId,
      newDeviceSession.deviceName,
      newDeviceSession.userId,
    ]);

    return newDeviceSession;
  }
  async updateDeviceSession(updateData: DeviceSessionModel): Promise<boolean> {
    const query = `UPDATE public."Devices"
            SET "iat"=$1, "exp"=$2, "ip"=$3, "deviceName"=$4
            WHERE "deviceId" = $5 AND "userId" = $6`;

    const resultUpdateDeviceSession = await this.dataSource.query(query, [
      updateData.iat,
      updateData.exp,
      updateData.ip,
      updateData.deviceName,
      updateData.deviceId,
      updateData.userId,
    ]);

    if (resultUpdateDeviceSession[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
  async terminateDeviceSessionByLogout(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const query = `DELETE FROM public."Devices"
             WHERE "deviceId" = $1 AND "userId" = $2`;

    const resultTerminateDeviceSession = await this.dataSource.query(query, [
      deviceId,
      userId,
    ]);

    if (resultTerminateDeviceSession[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
  async terminateAllOthersDevicesSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const query = `DELETE FROM public."Devices"
             WHERE "userId" = $1 AND "deviceId" NOT IN ($2)`;

    const resultTerminateAllOthersDevicesSessions = await this.dataSource.query(
      query,
      [userId, deviceId],
    );

    if (resultTerminateAllOthersDevicesSessions[1] > 0) {
      return true;
    } else {
      return false;
    }
  }
  async terminateDeviceSessionById(deviceId: string): Promise<boolean> {
    const query = `DELETE FROM public."Devices"
             WHERE "deviceId" = $1`;

    const resultTerminateDeviceSession = await this.dataSource.query(query, [
      deviceId,
    ]);

    if (resultTerminateDeviceSession[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
}
