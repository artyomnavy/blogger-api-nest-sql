import { Injectable } from '@nestjs/common';
import { BanInfo } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBanByAdmin } from '../domain/user-ban-by-admin.entity';

@Injectable()
export class UsersBansByAdminRepository {
  constructor(
    @InjectRepository(UserBanByAdmin)
    private readonly usersBansByAdminRepository: Repository<UserBanByAdmin>,
  ) {}
  async createUserBanInfo(
    banInfo: BanInfo,
    manager: EntityManager,
  ): Promise<UserBanByAdmin> {
    const userBan = new UserBanByAdmin();

    userBan.id = banInfo.id;
    userBan.isBanned = banInfo.isBanned;
    userBan.banDate = banInfo.banDate;
    userBan.banReason = banInfo.banReason;

    return await manager.save(userBan);
  }
  async updateUserBanInfoByAdmin(
    userBan: UserBanByAdmin,
    isBanned: boolean,
    banReason: string | null,
    banDate: Date | null,
    manager: EntityManager,
  ): Promise<boolean> {
    userBan.isBanned = isBanned;
    userBan.banReason = banReason;
    userBan.banDate = banDate;

    const resultUpdateBanInfo = await manager.save(userBan);

    return !!resultUpdateBanInfo;
  }
}
