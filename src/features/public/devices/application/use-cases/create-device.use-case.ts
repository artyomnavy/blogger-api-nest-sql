import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastrucure/devices.repository';
import { DeviceSession } from '../../api/models/device.output.model';
import { JwtService } from '../../../../../application/jwt.service';

export class CreateDeviceSessionCommand {
  constructor(
    public readonly deviceId: string,
    public readonly ip: string,
    public readonly deviceName: string,
    public readonly userId: string,
  ) {}
}
@CommandHandler(CreateDeviceSessionCommand)
export class CreateDeviceSessionUseCase
  implements ICommandHandler<CreateDeviceSessionCommand>
{
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    command: CreateDeviceSessionCommand,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    const accessToken = await this.jwtService.createAccessJWT(command.userId);

    const refreshToken = await this.jwtService.createRefreshJWT(
      command.deviceId,
      command.userId,
    );

    const payloadRefreshToken =
      await this.jwtService.getPayloadByToken(refreshToken);

    const iat = new Date(payloadRefreshToken.iat * 1000);
    const exp = new Date(payloadRefreshToken.exp * 1000);

    const newDeviceSession = new DeviceSession(
      iat,
      exp,
      command.ip,
      command.deviceId,
      command.deviceName,
      command.userId,
    );

    const createdDeviceSession =
      await this.devicesRepository.createDeviceSession(newDeviceSession);

    if (createdDeviceSession) {
      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } else {
      return null;
    }
  }
}
