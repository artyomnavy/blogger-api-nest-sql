import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastrucure/devices.repository';
import { JwtService } from '../../../../../application/jwt.service';

export class UpdateDeviceSessionCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
    public readonly newIp: string,
    public readonly newDeviceName: string,
  ) {}
}
@CommandHandler(UpdateDeviceSessionCommand)
export class UpdateDeviceSessionUseCase
  implements ICommandHandler<UpdateDeviceSessionCommand>
{
  constructor(
    private readonly devicesRepository: DevicesRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    command: UpdateDeviceSessionCommand,
  ): Promise<{ newAccessToken: string; newRefreshToken: string } | null> {
    const newAccessToken = await this.jwtService.createAccessJWT(
      command.userId,
    );

    const newRefreshToken = await this.jwtService.createRefreshJWT(
      command.deviceId,
      command.userId,
    );

    const newPayloadRefreshToken =
      await this.jwtService.getPayloadByToken(newRefreshToken);

    const newIat = new Date(newPayloadRefreshToken.iat * 1000);
    const newExp = new Date(newPayloadRefreshToken.exp * 1000);

    const updateDeviceSession =
      await this.devicesRepository.updateDeviceSession({
        iat: newIat,
        exp: newExp,
        ip: command.newIp,
        deviceId: command.deviceId,
        deviceName: command.newDeviceName,
        userId: command.userId,
      });

    if (!updateDeviceSession) {
      return null;
    } else {
      return {
        newAccessToken: newAccessToken,
        newRefreshToken: newRefreshToken,
      };
    }
  }
}
