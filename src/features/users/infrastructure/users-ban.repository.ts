import { Injectable } from '@nestjs/common';
import { BanInfo } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { UserBan } from '../domain/user-ban.entity';
import { UpdateUserBanModel } from '../api/models/user.input.model';

@Injectable()
export class UsersBanRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersBanRepository: Repository<UserBan>,
  ) {}
  async createUserBanInfo(
    banInfo: BanInfo,
    manager: EntityManager,
  ): Promise<UserBan> {
    const userBan = new UserBan();

    userBan.id = banInfo.id;
    userBan.isBanned = banInfo.isBanned;
    userBan.banDate = banInfo.banDate;
    userBan.banReason = banInfo.banReason;

    return await manager.save(userBan);
  }
  async updateUserBanInfo(
    userId: string,
    updateData: UpdateUserBanModel,
    banDate: Date | null,
    manager: EntityManager,
  ): Promise<boolean> {
    const resultUpdateBanInfo = await manager
      .createQueryBuilder()
      .update(UserBan)
      .set({
        isBanned: updateData.isBanned,
        banReason: updateData.banReason,
        banDate: banDate,
      })
      .where('user_id = :userId', { userId: userId })
      .execute();

    return resultUpdateBanInfo.affected === 1;
  }
}
