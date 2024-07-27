import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserModel } from '../../api/models/user.input.model';
import bcrypt from 'bcrypt';
import {
  BanInfo,
  User,
  UserOutputModel,
} from '../../api/models/user.output.model';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { UsersBansByAdminRepository } from '../../infrastructure/users-bans-by-admin-repository';

export class CreateUserByAdminCommand {
  constructor(public readonly createData: CreateUserModel) {}
}
@CommandHandler(CreateUserByAdminCommand)
export class CreateUserByAdminUseCase
  extends TransactionManagerUseCase<
    CreateUserByAdminCommand,
    ResultType<UserOutputModel | null>
  >
  implements ICommandHandler<CreateUserByAdminCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersBanRepository: UsersBansByAdminRepository,
    private readonly usersQueryRepository: UsersQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: CreateUserByAdminCommand,
    manager: EntityManager,
  ): Promise<ResultType<UserOutputModel | null>> {
    // Хэшируем пароль пользователя
    const passwordHash = await bcrypt.hash(command.createData.password, 10);

    // Создаем информацию о бане пользователя
    const newBanInfo = new BanInfo(uuidv4(), false, null, null);

    const userBan = await this.usersBanRepository.createUserBanInfo(
      newBanInfo,
      manager,
    );

    // Создаем пользователя с информацией о бане
    const newUser = new User(
      uuidv4(),
      command.createData.login,
      passwordHash,
      command.createData.email,
      new Date(),
      null,
      null,
      true,
      userBan,
    );

    const userId = await this.usersRepository.createUser(newUser, manager);

    const user = await this.usersQueryRepository.getUserById(userId, manager);

    if (!user) {
      return {
        data: null,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    return {
      data: user,
      code: ResultCode.SUCCESS,
    };
  }
}
