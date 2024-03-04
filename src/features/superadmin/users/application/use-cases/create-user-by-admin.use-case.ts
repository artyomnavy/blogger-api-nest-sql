import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserModel } from '../../api/models/user.input.model';
import bcrypt from 'bcrypt';
import { User, UserOutputModel } from '../../api/models/user.output.model';
import { ObjectId } from 'mongodb';

export class CreateUserByAdminCommand {
  constructor(public readonly createData: CreateUserModel) {}
}
@CommandHandler(CreateUserByAdminCommand)
export class CreateUserByAdminUseCase
  implements ICommandHandler<CreateUserByAdminCommand>
{
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute(command: CreateUserByAdminCommand): Promise<UserOutputModel> {
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
        confirmationCode: null,
        expirationDate: null,
        isConfirmed: true,
      },
    );

    const createdUser = await this.usersRepository.createUser(newUser);

    return createdUser;
  }
}
