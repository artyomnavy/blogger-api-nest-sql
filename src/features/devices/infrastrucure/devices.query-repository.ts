import {
  deviceSessionMapper,
  DeviceSessionModel,
  DeviceSessionOutputModel,
} from '../api/models/device.output.model';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Device } from '../domain/device.entity';

@Injectable()
export class DevicesQueryRepository {
  constructor(
    @InjectRepository(Device)
    private readonly devicesQueryRepository: Repository<Device>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async checkDeviceSession(
    userId: string,
    deviceId: string,
  ): Promise<DeviceSessionModel | null> {
    const deviceSession = await this.devicesQueryRepository
      .createQueryBuilder()
      .select([
        'd.iat',
        'd.exp',
        'd.ip',
        'd.deviceId',
        'd.deviceName',
        'd.userId',
      ])
      .from(Device, 'd')
      .where('d.deviceId = :deviceId AND d.userId = :userId', {
        deviceId,
        userId,
      })
      .getOne();

    if (!deviceSession) {
      return null;
    } else {
      return deviceSession;
    }
  }
  async getAllDevicesSessionsForUser(
    userId: string,
  ): Promise<DeviceSessionOutputModel[]> {
    const devicesSessions = await this.devicesQueryRepository
      .createQueryBuilder('d')
      .select([
        'd.iat',
        'd.exp',
        'd.ip',
        'd.deviceId',
        'd.deviceName',
        'd.userId',
      ])
      .where('d.userId = :userId', {
        userId,
      })
      .getMany();

    return devicesSessions.map(deviceSessionMapper);
  }
  async getDeviceSessionById(
    deviceId: string,
  ): Promise<DeviceSessionModel | null> {
    const deviceSession = await this.devicesQueryRepository
      .createQueryBuilder()
      .select([
        'd.iat',
        'd.exp',
        'd.ip',
        'd.deviceId',
        'd.deviceName',
        'd.userId',
      ])
      .from(Device, 'd')
      .where('d.deviceId = :deviceId', {
        deviceId,
      })
      .getOne();

    if (!deviceSession) {
      return null;
    } else {
      return deviceSession;
    }
  }
}
