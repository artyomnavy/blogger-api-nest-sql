import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';
import { EmailsManager } from '../../managers/emails-manager';
import { CreateUserModel } from '../../../users/api/models/user.input.model';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { BanInfo, User } from '../../../users/api/models/user.output.model';
import { ResultType } from '../../../../common/types/result';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';
import { DataSource, EntityManager } from 'typeorm';
import { ResultCode } from '../../../../common/utils';
import { UsersQueryRepository } from '../../../users/infrastructure/users.query-repository';
import { UsersBansRepository } from '../../../users/infrastructure/users-bans-repository.service';

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
    private readonly usersBanRepository: UsersBansRepository,
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
      uuidv4(),
      add(new Date(), {
        minutes: 10,
      }),
      false,
      userBan,
    );

    const userId = await this.usersRepository.createUser(newUser, manager);

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
