import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { EmailsManager } from '../../managers/emails-manager';
import { CreateUserModel } from '../../../users/api/models/user.input.model';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import {
  User,
  UserOutputModel,
} from '../../../users/api/models/user.output.model';

export class CreateUserByRegistrationCommand {
  constructor(public readonly createData: CreateUserModel) {}
}
@CommandHandler(CreateUserByRegistrationCommand)
export class CreateUserByRegistrationUseCase
  implements ICommandHandler<CreateUserByRegistrationCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailsManager: EmailsManager,
  ) {}

  async execute(
    command: CreateUserByRegistrationCommand,
  ): Promise<UserOutputModel | null> {
    const passwordHash = await bcrypt.hash(command.createData.password, 10);

    const newUser = new User(
      uuidv4(),
      command.createData.login,
      passwordHash,
      command.createData.email,
      new Date(),
      uuidv4(),
      add(new Date(), {
        minutes: 10,
      }),
      false,
    );

    const createdUser = await this.usersRepository.createUser(newUser);

    try {
      await this.emailsManager.sendEmailConfirmationMessage(
        newUser.email,
        newUser.confirmationCode!,
      );
    } catch (e) {
      console.error(e);
      return null;
    }

    return createdUser;
  }
}
