import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserBanByBloggers } from '../domain/user-ban-by-blogger.entity';

@Injectable()
export class UsersBansByBloggersRepository {
  constructor(
    @InjectRepository(UserBanByBloggers)
    private readonly usersBanRepository: Repository<UserBanByBloggers>,
  ) {}
  async createUserBanInfoByBlogger(
    isBanned: boolean,
    banReason: string | null,
    banDate: Date | null,
    blogId: string | null,
    manager: EntityManager,
  ): Promise<boolean> {
    const userBanByBlogger = new UserBanByBloggers();

    userBanByBlogger.isBanned = isBanned;
    userBanByBlogger.banReason = banReason;
    userBanByBlogger.banDate = banDate;
    userBanByBlogger.blogId = blogId;

    const resultUpdateBanInfo = await manager.save(userBanByBlogger);

    return !!resultUpdateBanInfo;
  }
  async deleteUserBanInfoByBlogger(
    userId: string,
    blogId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const resultDeleteBanInfoByBlogger = await manager.delete(
      UserBanByBloggers,
      { userId: userId, blogId: blogId },
    );

    return resultDeleteBanInfoByBlogger.affected === 1;
  }
}
