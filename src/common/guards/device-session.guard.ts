import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DevicesQueryRepository } from '../../features/public/devices/infrastrucure/devices.query-repository';

@Injectable()
export class DeviceSessionGuard implements CanActivate {
  constructor(
    private readonly devicesQueryRepository: DevicesQueryRepository,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const deviceId = req.params.id;
    const userId = req.userId;

    const deviceSession =
      await this.devicesQueryRepository.getDeviceSessionById(deviceId);

    if (!deviceSession) {
      throw new NotFoundException('Device session not found');
    }

    if (userId !== deviceSession.userId) {
      throw new ForbiddenException("Device session other user's");
    }

    return true;
  }
}
