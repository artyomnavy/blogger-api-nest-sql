import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastrucure/devices.repository';

export class TerminateDeviceSessionByLogoutCommand {
  constructor(
    public readonly deviceId: string,
    public readonly userId: string,
  ) {}
}
@CommandHandler(TerminateDeviceSessionByLogoutCommand)
export class TerminateDeviceSessionByLogoutUseCase
  implements ICommandHandler<TerminateDeviceSessionByLogoutCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(
    command: TerminateDeviceSessionByLogoutCommand,
  ): Promise<boolean> {
    return await this.devicesRepository.terminateDeviceSessionByLogout(
      command.deviceId,
      command.userId,
    );
  }
}
