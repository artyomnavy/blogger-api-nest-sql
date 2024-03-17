import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { UsersRepository } from '../../../users/infrastructure/users.repository';

export class UpdatePasswordForRecoveryCommand {
  constructor(
    public readonly recoveryCode: string,
    public readonly newPassword: string,
  ) {}
}
@CommandHandler(UpdatePasswordForRecoveryCommand)
export class UpdatePasswordForRecoveryUseCase
  implements ICommandHandler<UpdatePasswordForRecoveryCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: UpdatePasswordForRecoveryCommand): Promise<boolean> {
    const newPasswordHash = await bcrypt.hash(command.newPassword, 10);

    return await this.usersRepository.updatePasswordForRecovery(
      command.recoveryCode,
      newPasswordHash,
    );
  }
}
