import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { EmailsManager } from '../../../../../managers/emails-manager';
import { CreateUserModel } from '../../../../superadmin/users/api/models/user.input.model';
import { UsersRepository } from '../../../../superadmin/users/infrastructure/users.repository';
import {
  User,
  UserOutputModel,
} from '../../../../superadmin/users/api/models/user.output.model';

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
      new ObjectId(),
      {
        login: command.createData.login,
        password: passwordHash,
        email: command.createData.email,
        createdAt: new Date(),
      },
      {
        confirmationCode: uuidv4(),
        expirationDate: add(new Date(), {
          minutes: 10,
        }),
        isConfirmed: false,
      },
    );

    const createdUser = await this.usersRepository.createUser(newUser);

    try {
      await this.emailsManager.sendEmailConfirmationMessage(
        newUser.accountData.email,
        newUser.emailConfirmation.confirmationCode!,
      );
    } catch (e) {
      console.error(e);
      return null;
    }

    return createdUser;
  }
}
