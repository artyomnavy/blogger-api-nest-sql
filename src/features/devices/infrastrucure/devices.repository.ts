import { Injectable } from '@nestjs/common';
import { DeviceSessionModel } from '../api/models/device.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../domain/device.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
  ) {}
  async createDeviceSession(
    newDeviceSession: DeviceSessionModel,
  ): Promise<DeviceSessionModel> {
    await this.devicesRepository
      .createQueryBuilder()
      .insert()
      .into(Device)
      .values(newDeviceSession)
      .execute();

    return newDeviceSession;
  }
  async updateDeviceSession(updateData: DeviceSessionModel): Promise<boolean> {
    const resultUpdateDeviceSession = await this.devicesRepository
      .createQueryBuilder()
      .update(Device)
      .set({
        iat: updateData.iat,
        exp: updateData.exp,
        ip: updateData.ip,
        deviceName: updateData.deviceName,
      })
      .where('deviceId = :deviceId AND userId = :userId', {
        deviceId: updateData.deviceId,
        userId: updateData.userId,
      })
      .execute();

    return resultUpdateDeviceSession.affected === 1;
  }
  async terminateDeviceSessionByLogout(
    deviceId: string,
    userId: string,
  ): Promise<boolean> {
    const resultTerminateDeviceSession = await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .where('deviceId = :deviceId AND userId = :userId', {
        deviceId,
        userId,
      })
      .execute();

    return resultTerminateDeviceSession.affected === 1;
  }
  async terminateAllOthersDevicesSessions(
    userId: string,
    deviceId: string,
  ): Promise<boolean> {
    const resultTerminateAllOthersDevicesSessions = await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .where('userId = :userId AND deviceId NOT IN (:deviceId)', {
        userId,
        deviceId,
      })
      .execute();

    return resultTerminateAllOthersDevicesSessions.affected === 1;
  }
  async terminateDeviceSessionById(deviceId: string): Promise<boolean> {
    const resultTerminateDeviceSession = await this.devicesRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .where('deviceId = :deviceId', {
        deviceId,
      })
      .execute();

    return resultTerminateDeviceSession.affected === 1;
  }
}
