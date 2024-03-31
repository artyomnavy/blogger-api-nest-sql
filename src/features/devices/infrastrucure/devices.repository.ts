import { Injectable } from '@nestjs/common';
import { DeviceSessionModel } from '../api/models/device.output.model';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Device } from '../domain/device.entity';

@Injectable()
export class DevicesRepository {
  constructor(
    @InjectRepository(Device)
    private readonly devicesRepository: Repository<Device>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async createDeviceSession(
    newDeviceSession: DeviceSessionModel,
  ): Promise<DeviceSessionModel> {
    // const query = `INSERT INTO public."Devices"(
    //         "iat", "exp", "ip", "deviceId", "deviceName", "userId")
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

    await this.devicesRepository
      .createQueryBuilder()
      .insert()
      .into(Device)
      .values(newDeviceSession)
      .execute();

    return newDeviceSession;
  }
  async updateDeviceSession(updateData: DeviceSessionModel): Promise<boolean> {
    // const query = `UPDATE public."Devices"
    //         SET "iat"=$1, "exp"=$2, "ip"=$3, "deviceName"=$4
    //         WHERE "deviceId" = $5 AND "userId" = $6`;
    //
    // const resultUpdateDeviceSession = await this.dataSource.query(query, [
    //   updateData.iat,
    //   updateData.exp,
    //   updateData.ip,
    //   updateData.deviceName,
    //   updateData.deviceId,
    //   updateData.userId,
    // ]);

    // if (resultUpdateDeviceSession[1] === 1) {
    //   return true;
    // } else {
    //   return false;
    // }

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
    // const query = `DELETE FROM public."Devices"
    //          WHERE "deviceId" = $1 AND "userId" = $2`;
    //
    // const resultTerminateDeviceSession = await this.dataSource.query(query, [
    //   deviceId,
    //   userId,
    // ]);
    //
    // if (resultTerminateDeviceSession[1] === 1) {
    //   return true;
    // } else {
    //   return false;
    // }

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
    // const query = `DELETE FROM public."Devices"
    //          WHERE "userId" = $1 AND "deviceId" NOT IN ($2)`;
    //
    // const resultTerminateAllOthersDevicesSessions = await this.dataSource.query(
    //   query,
    //   [userId, deviceId],
    // );
    //
    // if (resultTerminateAllOthersDevicesSessions[1] > 0) {
    //   return true;
    // } else {
    //   return false;
    // }

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
    // const query = `DELETE FROM public."Devices"
    //          WHERE "deviceId" = $1`;
    //
    // const resultTerminateDeviceSession = await this.dataSource.query(query, [
    //   deviceId,
    // ]);
    //
    // if (resultTerminateDeviceSession[1] === 1) {
    //   return true;
    // } else {
    //   return false;
    // }

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
