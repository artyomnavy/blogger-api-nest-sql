import { DevicesQueryRepository } from '../infrastrucure/devices.query-repository';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { HTTP_STATUSES } from '../../../../utils';
import { TerminateDeviceSessionByIdCommand } from '../application/use-cases/terminate-device-by-id.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { TerminateAllOthersDevicesSessionsCommand } from '../application/use-cases/terminate-all-other-devices.use-case';
import { RefreshTokenAuthGuard } from '../../../../common/guards/refresh-token-auth.guard';
import { DeviceSessionGuard } from '../../../../common/guards/device-session.guard';

@Controller('security')
export class DevicesController {
  constructor(
    protected devicesQueryRepository: DevicesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('devices')
  @UseGuards(RefreshTokenAuthGuard)
  async getAllDevicesSessionsForUser(@Req() req: Request) {
    const userId = req.userId!;

    const devicesSessions =
      await this.devicesQueryRepository.getAllDevicesSessionsForUser(userId);

    return devicesSessions;
  }
  @Delete('devices')
  @UseGuards(RefreshTokenAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async terminateSessionsForAllOthersDevices(@Req() req: Request) {
    const userId = req.userId!;
    const deviceId = req.deviceId!;

    const isTerminateDevicesSessions = await this.commandBus.execute(
      new TerminateAllOthersDevicesSessionsCommand(userId, deviceId),
    );

    if (isTerminateDevicesSessions) return;
  }
  @Delete('devices/:id')
  @UseGuards(RefreshTokenAuthGuard, DeviceSessionGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async terminateSessionForDevice(@Param('id') deviceId: string) {
    const isTerminateDeviceSessionById = await this.commandBus.execute(
      new TerminateDeviceSessionByIdCommand(deviceId),
    );

    if (isTerminateDeviceSessionById) return;
  }
}
