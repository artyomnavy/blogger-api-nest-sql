import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserModel } from '../../api/models/user.input.model';
import bcrypt from 'bcrypt';
import { User, UserOutputModel } from '../../api/models/user.output.model';
import { v4 as uuidv4 } from 'uuid';

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
      uuidv4(),
      command.createData.login,
      passwordHash,
      command.createData.email,
      new Date().toISOString(),
      null,
      null,
      true,
    );

    const createdUser = await this.usersRepository.createUser(newUser);

    return createdUser;
  }
}
