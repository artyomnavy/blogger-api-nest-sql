import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastrucure/devices.repository';

export class TerminateAllOthersDevicesSessionsCommand {
  constructor(
    public readonly userId: string,
    public readonly deviceId: string,
  ) {}
}
@CommandHandler(TerminateAllOthersDevicesSessionsCommand)
export class TerminateAllOthersDevicesSessionsUseCase
  implements ICommandHandler<TerminateAllOthersDevicesSessionsCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(
    command: TerminateAllOthersDevicesSessionsCommand,
  ): Promise<boolean> {
    return await this.devicesRepository.terminateAllOthersDevicesSessions(
      command.userId,
      command.deviceId,
    );
  }
}
