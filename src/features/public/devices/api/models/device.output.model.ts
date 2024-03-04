import { DeviceSessionDocument } from '../../domain/device.entity';

export class DeviceSessionModel {
  iat: Date;
  exp: Date;
  ip: string;
  deviceId: string;
  deviceName: string;
  userId: string;
}

export class DeviceSessionOutputModel {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}

export class DeviceSession {
  constructor(
    public iat: Date,
    public exp: Date,
    public ip: string,
    public deviceId: string,
    public deviceName: string,
    public userId: string,
  ) {}
}

export const deviceSessionMapper = (
  deviceSession: DeviceSessionDocument,
): DeviceSessionOutputModel => {
  return {
    ip: deviceSession.ip,
    title: deviceSession.deviceName,
    lastActiveDate: deviceSession.iat.toISOString(),
    deviceId: deviceSession.deviceId,
  };
};
