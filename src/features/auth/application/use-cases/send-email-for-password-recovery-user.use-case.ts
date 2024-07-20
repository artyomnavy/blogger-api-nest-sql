import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailsManager } from '../../managers/emails-manager';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';

export class SendEmailForPasswordRecoveryCommand {
  constructor(public readonly email: string) {}
}
@CommandHandler(SendEmailForPasswordRecoveryCommand)
export class SendEmailForPasswordRecoveryUseCase
  implements ICommandHandler<SendEmailForPasswordRecoveryCommand>
{
  constructor(
    private readonly emailsManager: EmailsManager,
    private readonly usersRepository: UsersRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
  ) {}

  async execute(
    command: SendEmailForPasswordRecoveryCommand,
  ): Promise<boolean> {
    const user = await this.usersQueryRepository.getUserByEmail(command.email);

    if (!user) {
      return true;
    }

    const newCode = uuidv4();
    const newExpirationDate = add(new Date(), {
      minutes: 10,
    }).toISOString();

    const isUpdated = await this.usersRepository.updateConfirmationCode(
      command.email,
      newCode,
      newExpirationDate,
    );

    if (!isUpdated) {
      return false;
    }

    try {
      await this.emailsManager.sendEmailReconfirmationMessage(
        command.email,
        newCode,
      );
    } catch (e) {
      console.error(e);
      return false;
    }

    return true;
  }
}
