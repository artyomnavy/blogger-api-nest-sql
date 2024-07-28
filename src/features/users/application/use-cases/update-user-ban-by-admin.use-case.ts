import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateUserBanByAdminModel } from '../../api/models/user.input.model';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { ResultCode } from '../../../../common/utils';
import { ResultType } from '../../../../common/types/result';
import { DevicesRepository } from '../../../devices/infrastrucure/devices.repository';
import { UsersBansByAdminRepository } from '../../infrastructure/users-bans-by-admin-repository';
import { DataSource, EntityManager } from 'typeorm';
import { TransactionManagerUseCase } from '../../../../common/use-cases/transaction.use-case';

export class UpdateUserBanInfoByAdminCommand {
  constructor(
    public readonly userId: string,
    public readonly updateData: UpdateUserBanByAdminModel,
  ) {}
}
@CommandHandler(UpdateUserBanInfoByAdminCommand)
export class UpdateUserBanInfoByAdminUseCase
  extends TransactionManagerUseCase<
    UpdateUserBanInfoByAdminCommand,
    ResultType<boolean>
  >
  implements ICommandHandler<UpdateUserBanInfoByAdminCommand>
{
  constructor(
    private readonly usersQueryRepository: UsersQueryRepository,
    private readonly usersBansByAdminRepository: UsersBansByAdminRepository,
    private readonly devicesRepository: DevicesRepository,
    protected readonly dataSource: DataSource,
  ) {
    super(dataSource);
  }

  async doLogic(
    command: UpdateUserBanInfoByAdminCommand,
    manager: EntityManager,
  ): Promise<ResultType<boolean>> {
    const { userId, updateData } = command;

    // Устанавливаем значения по умолчанию для даты и причины бана
    let banDate: Date | null = null;
    let banReason: string | null = null;

    // Проверяем существует ли такой пользователь
    const user = await this.usersQueryRepository.getOrmUserByIdWithBanInfo(
      userId,
      manager,
    );

    if (!user) {
      return {
        data: false,
        code: ResultCode.NOT_FOUND,
        message: 'User not found',
      };
    }

    if (updateData.isBanned) {
      banDate = new Date();
      banReason = updateData.banReason;
      // Останавливаем (удаляем) все сессии забаненного пользователя
      await this.devicesRepository.terminateAllDevicesSessionsForBannedUser(
        userId,
        manager,
      );
    }

    // Обновляем информацию о бане пользователя
    await this.usersBansByAdminRepository.updateUserBanInfoByAdmin(
      user.userBanByAdmin,
      updateData.isBanned,
      banReason,
      banDate,
      manager,
    );

    return {
      data: true,
      code: ResultCode.SUCCESS,
    };
  }
}
