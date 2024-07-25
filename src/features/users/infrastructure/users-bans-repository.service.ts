import { Injectable } from '@nestjs/common';
import { BanInfo } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { UserBan } from '../domain/user-ban.entity';
import { UpdateUserBanModel } from '../api/models/user.input.model';

@Injectable()
export class UsersBansRepository {
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
    userBan: UserBan,
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
