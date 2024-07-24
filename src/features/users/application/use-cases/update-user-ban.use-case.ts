import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserBanModel } from '../../api/models/user.input.model';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { DevicesRepository } from '../../../devices/infrastrucure/devices.repository';
import { UsersBanRepository } from '../../infrastructure/users-ban.repository';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';

export class UpdateUserBanInfoCommand {
  constructor(
    public readonly userId: string,
    public readonly updateData: UpdateUserBanModel,
  ) {}
}
@CommandHandler(UpdateUserBanInfoCommand)
export class UpdateUserBanInfoUseCase
  extends TransactionManagerUseCase<
    UpdateUserBanInfoCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<UpdateUserBanInfoCommand>
{
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersBanRepository: UsersBanRepository,
    private readonly devicesRepository: DevicesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: UpdateUserBanInfoCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { userId, updateData } = command;

    // Устанавливаем значение даты бана по умолчанию
    let banDate: Date | null = null;

    // Проверяем существует ли такой пользователь
    const user = await this.usersQueryRepository.getUserById(userId, manager);

    if (!user) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    if (updateData.isBanned) {
      banDate = new Date();
      // Останавливаем (удаляем) все сессии забаненного пользователя
      await this.devicesRepository.terminateAllDevicesSessionsForBannedUser(
        userId,
        manager,
      );
    }

    // Обновляем информацию о бане пользователя
    await this.usersBanRepository.updateUserBanInfo(
      userId,
      updateData,
      banDate,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
