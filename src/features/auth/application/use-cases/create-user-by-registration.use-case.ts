import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { EmailsManager } from '../../managers/emails-manager';
import { CreateUserModel } from '../../../users/api/models/user.input.model';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import {
  BanInfoByAdmin,
  BanInfoByBlogger,
  User,
} from '../../../users/api/models/user.output.model';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { ResultCode } from '../../../../common/utils';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { UsersBansByAdminRepository } from '../../../users/infrastructure/users-bans-by-admin-repository';
import { UsersBansByBloggersRepository } from '../../../users/infrastructure/users-bans-by-bloggers-repository';

export class CreateUserByRegistrationCommand {
  constructor(public readonly createData: CreateUserModel) {}
}
@CommandHandler(CreateUserByRegistrationCommand)
export class CreateUserByRegistrationUseCase
  extends TransactionManagerUseCase<
    CreateUserByRegistrationCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<CreateUserByRegistrationCommand>
{
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly usersBansByAdminRepository: UsersBansByAdminRepository,
    private readonly usersBansByBloggersRepository: UsersBansByBloggersRepository,
    private readonly emailsManager: EmailsManager,
    private readonly usersQueryRepository: UsersQueryRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: CreateUserByRegistrationCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    // Хэшируем пароль пользователя
    const passwordHash = await bcrypt.hash(command.createData.password, 10);

    // Создаем информацию о банах пользователя
    const newBanInfo = new BanInfoByAdmin(uuidv4(), false, null, null);

    const userBanByAdmin =
      await this.usersBansByAdminRepository.createUserBanInfoByAdmin(
        newBanInfo,
        manager,
      );

    const newBanInfoByBlogger = new BanInfoByBlogger(
      uuidv4(),
      false,
      null,
      null,
      null,
    );

    const userBanByBlogger =
      await this.usersBansByBloggersRepository.createUserBanInfoByBlogger(
        newBanInfoByBlogger,
        manager,
      );

    // Создаем пользователя с информацией о банах
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

    const userId = await this.usersRepository.createUser(
      newUser,
      userBanByAdmin,
      userBanByBlogger,
      manager,
    );

    // Отправляем код подтверждения на электронную почту
    try {
      await this.emailsManager.sendEmailConfirmationMessage(
        newUser.email,
        newUser.confirmationCode!,
      );
    } catch (e) {
      console.error(e);
      return {
        data: false,
        code: ResultCode.IM_A_TEAPOT,
        message:
          "Recovery code don't sending to passed email address, try later",
      };
    }

    const user = await this.usersQueryRepository.getUserById(userId, manager);

    if (!user) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
