import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DevicesRepository } from '../../infrastrucure/devices.repository';

export class TerminateDeviceSessionByIdCommand {
  constructor(public readonly deviceId: string) {}
}
@CommandHandler(TerminateDeviceSessionByIdCommand)
export class TerminateDeviceSessionByIdUseCase
  implements ICommandHandler<TerminateDeviceSessionByIdCommand>
{
  constructor(private readonly devicesRepository: DevicesRepository) {}

  async execute(command: TerminateDeviceSessionByIdCommand): Promise<boolean> {
    return await this.devicesRepository.terminateDeviceSessionById(
      command.deviceId,
    );
  }
}
