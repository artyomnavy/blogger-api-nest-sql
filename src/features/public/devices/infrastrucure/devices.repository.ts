import { Injectable } from '@nestjs/common';
import { DeviceSessionModel } from '../api/models/device.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { DeviceSession, DeviceSessionDocument } from '../domain/device.entity';
import { Model } from 'mongoose';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectModel(DeviceSession.name)
    private deviceModel: Model<DeviceSessionDocument>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async createDeviceSession(
    newDeviceSession: DeviceSessionModel,
  ): Promise<DeviceSessionModel> {
    // const query = `INSERT INTO public."Devices"(
    //         "Iat", "Exp", "Ip", "DeviceId", "DeviceName", "UserId")
    //         VALUES ($1, $2, $3, $4, $5, $6)`;
    //
    // await this.dataSource.query(query, [
    //   newDeviceSession.iat,
    //   newDeviceSession.exp,
    //   newDeviceSession.ip,
    //   newDeviceSession.deviceId,
    //   newDeviceSession.deviceName,
    //   newDeviceSession.userId,
    // ]);
    //
    // return newDeviceSession;

    const resultCreateDeviceSession =
      await this.deviceModel.create(newDeviceSession);

    return resultCreateDeviceSession;
  }
  async updateDeviceSession(updateData: DeviceSessionModel): Promise<boolean> {
    // const query = `UPDATE public."Devices"
    //         SET "Iat"=updateData.iat, "Exp"=updateData.exp, "Ip"=updateData.ip, "DeviceName"=?
    //         WHERE <condition>`;

    const resultUpdateDeviceSession = await this.deviceModel.updateOne(
      {
        deviceId: updateData.deviceId,
        userId: updateData.userId,
      },
      {
        $set: {
          iat: updateData.iat,
          exp: updateData.exp,
          ip: updateData.ip,
          deviceName: updateData.deviceName,
        },
      },
    );

    return resultUpdateDeviceSession.matchedCount === 1;
  }
  async terminateDeviceSessionByLogout(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const resultTerminateDeviceSession = await this.deviceModel.deleteOne({
      deviceId: deviceId,
      userId: userId,
    });

    return resultTerminateDeviceSession.deletedCount === 1;
  }
  async terminateAllOthersDevicesSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const resultTerminateAllOthersDevicesSessions =
      await this.deviceModel.deleteMany({
        userId: userId,
        deviceId: {
          $ne: deviceId,
        },
      });
    return resultTerminateAllOthersDevicesSessions.deletedCount === 1;
  }
  async terminateDeviceSessionById(deviceId: string): Promise<boolean> {
    const resultTerminateDeviceSession = await this.deviceModel.deleteOne({
      deviceId: deviceId,
    });

    return resultTerminateDeviceSession.deletedCount === 1;
  }
}
