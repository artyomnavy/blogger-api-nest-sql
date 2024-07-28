import { Injectable } from '@nestjs/common';
import { BanInfoByAdmin } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBanByAdmin } from '../domain/user-ban-by-admin.entity';

@Injectable()
export class UsersBansByAdminRepository {
  constructor(
    @InjectRepository(UserBanByAdmin)
    private readonly usersBansByAdminRepository: Repository<UserBanByAdmin>,
  ) {}
  async createUserBanInfoByAdmin(
    banInfoByAdmin: BanInfoByAdmin,
    manager: EntityManager,
  ): Promise<UserBanByAdmin> {
    const userBanByAdmin = new UserBanByAdmin();

    userBanByAdmin.id = banInfoByAdmin.id;
    userBanByAdmin.isBanned = banInfoByAdmin.isBanned;
    userBanByAdmin.banDate = banInfoByAdmin.banDate;
    userBanByAdmin.banReason = banInfoByAdmin.banReason;

    return await manager.save(userBanByAdmin);
  }
  async updateUserBanInfoByAdmin(
    userBanByAdmin: UserBanByAdmin,
    isBanned: boolean,
    banReason: string | null,
    banDate: Date | null,
    manager: EntityManager,
  ): Promise<boolean> {
    userBanByAdmin.isBanned = isBanned;
    userBanByAdmin.banReason = banReason;
    userBanByAdmin.banDate = banDate;

    const resultUpdateBanInfoByAdmin = await manager.save(userBanByAdmin);

    return !!resultUpdateBanInfoByAdmin;
  }
}
