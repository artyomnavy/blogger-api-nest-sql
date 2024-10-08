import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CreateUserModel } from '../../api/models/user.input.model';
import bcrypt from 'bcrypt';
import { User, UserOutputModel } from '../../api/models/user.output.model';
import { v4 as uuidv4 } from 'uuid';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { UsersBansByAdminRepository } from '../../../bans/infrastructure/users-bans-by-admin-repository';
import { UsersBansByBloggersRepository } from '../../../bans/infrastructure/users-bans-by-bloggers-repository';
import {
  UserBanInfoByAdmin,
  UserBanInfoByBlogger,
} from '../../../bans/api/models/ban.output.model';

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
    private readonly usersBansByAdminRepository: UsersBansByAdminRepository,
    private readonly usersBansByBloggersRepository: UsersBansByBloggersRepository,
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

    // Создаем информацию о банах пользователя
    const newUserBanInfoByAdmin = new UserBanInfoByAdmin(
      uuidv4(),
      false,
      null,
      null,
    );

    const userBanByAdmin =
      await this.usersBansByAdminRepository.createUserBanInfoByAdmin(
        newUserBanInfoByAdmin,
        manager,
      );

    const newUserBanInfoByBlogger = new UserBanInfoByBlogger(
      uuidv4(),
      false,
      null,
      null,
      null,
    );

    const userBanByBlogger =
      await this.usersBansByBloggersRepository.createUserBanInfoByBlogger(
        newUserBanInfoByBlogger,
        manager,
      );

    // Создаем пользователя с информацией о банах
    const newUser = new User(
      uuidv4(),
      command.createData.login,
      passwordHash,
      command.createData.email,
      new Date(),
      null,
      null,
      true,
    );

    const userId = await this.usersRepository.createUser(
      newUser,
      userBanByAdmin,
      userBanByBlogger,
      manager,
    );

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
