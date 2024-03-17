import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailsManager } from '../../managers/emails-manager';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { UsersRepository } from '../../../users/infrastructure/users.repository';

export class ResendingEmailCommand {
  constructor(public readonly email: string) {}
}
@CommandHandler(ResendingEmailCommand)
export class ResendingEmailUseCase
  implements ICommandHandler<ResendingEmailCommand>
{
  constructor(
    private readonly emailsManager: EmailsManager,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(command: ResendingEmailCommand): Promise<boolean> {
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
      await this.emailsManager.sendEmailConfirmationMessage(
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
