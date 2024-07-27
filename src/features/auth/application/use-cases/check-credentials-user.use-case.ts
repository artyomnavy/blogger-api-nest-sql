import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { AuthLoginModel } from '../../api/models/auth.input.model';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { User } from '../../../users/domain/user.entity';

export class CheckCredentialsCommand {
  constructor(public readonly inputData: AuthLoginModel) {}
}
@CommandHandler(CheckCredentialsCommand)
export class CheckCredentialsUseCase
  implements ICommandHandler<CheckCredentialsCommand>
{
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(command: CheckCredentialsCommand): Promise<User | null> {
    const user = await this.usersQueryRepository.getUserByLoginOrEmail(
      command.inputData.loginOrEmail,
    );

    if (!user || !user.isConfirmed || user.userBanByAdmin.isBanned) {
      return null;
    }

    const checkPassword = await bcrypt.compare(
      command.inputData.password,
      user.password,
    );

    if (!checkPassword) {
      return null;
    } else {
      return user;
    }
  }
}
