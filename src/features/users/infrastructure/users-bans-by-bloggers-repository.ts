import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBanByBloggers } from '../domain/user-ban-by-blogger.entity';
import { UserBanInfoByBlogger } from '../api/models/user.output.model';

@Injectable()
export class UsersBansByBloggersRepository {
  constructor(
    @InjectRepository(UserBanByBloggers)
    private readonly usersBansByBloggersRepository: Repository<UserBanByBloggers>,
  ) {}
  async createUserBanInfoByBlogger(
    banInfoByBlogger: UserBanInfoByBlogger,
    manager: EntityManager,
  ): Promise<UserBanByBloggers> {
    const userBanByBlogger = new UserBanByBloggers();

    userBanByBlogger.id = banInfoByBlogger.id;
    userBanByBlogger.isBanned = banInfoByBlogger.isBanned;
    userBanByBlogger.banDate = banInfoByBlogger.banDate;
    userBanByBlogger.banReason = banInfoByBlogger.banReason;
    userBanByBlogger.blogId = banInfoByBlogger.blogId;

    return await manager.save(userBanByBlogger);
  }
  async updateUserBanInfoByBlogger(
    userBanByBlogger: UserBanByBloggers,
    isBanned: boolean,
    banReason: string | null,
    banDate: Date | null,
    blogId: string | null,
    manager: EntityManager,
  ): Promise<boolean> {
    userBanByBlogger.isBanned = isBanned;
    userBanByBlogger.banReason = banReason;
    userBanByBlogger.banDate = banDate;
    userBanByBlogger.blogId = blogId;

    const resultUpdateUserBanInfoByBlogger =
      await manager.save(userBanByBlogger);

    return !!resultUpdateUserBanInfoByBlogger;
  }
}
