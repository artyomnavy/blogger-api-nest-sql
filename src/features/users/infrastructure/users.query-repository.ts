import { Injectable } from '@nestjs/common';
import { UserOutputModel } from '../api/models/user.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuthMeOutputModel } from '../../auth/api/models/auth.output.model';
import { User } from '../domain/user.entity';
import { BanStatus } from '../../../common/utils';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersQueryRepository: Repository<User>,
  ) {}
  async getAllUsers(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<UserOutputModel>> {
    const banStatus = queryData.banStatus ? queryData.banStatus : BanStatus.ALL;
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;
    const searchLoginTerm = queryData.searchLoginTerm
      ? queryData.searchLoginTerm
      : '';
    const searchEmailTerm = queryData.searchEmailTerm
      ? queryData.searchEmailTerm
      : '';

    const users = await this.usersQueryRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.login',
        'u.email',
        'u.password',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .leftJoinAndSelect('u.userBanByAdmin', 'uba')
      .where(banStatus === BanStatus.ALL ? '1=1' : 'uba.isBanned = :ban', {
        ban: banStatus === BanStatus.BANNED,
      })
      .andWhere('(u.login ILIKE :login OR u.email ILIKE :email)', {
        login: `%${searchLoginTerm}%`,
        email: `%${searchEmailTerm}%`,
      })
      .orderBy(`u.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.usersQueryRepository
      .createQueryBuilder('u')
      .leftJoin('u.userBanByAdmin', 'uba')
      .select('COUNT(u.id)')
      .where(banStatus === BanStatus.ALL ? '1=1' : 'uba.isBanned = :ban', {
        ban: banStatus === BanStatus.BANNED,
      })
      .andWhere('(u.login ILIKE :login OR u.email ILIKE :email)', {
        login: `%${searchLoginTerm}%`,
        email: `%${searchEmailTerm}%`,
      })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        users.map((user: User) => this.userMapperWithBanInfoForAdmin(user)),
      ),
    };
  }
  async getAllBannedUsersForBlog(
    blogId: string,
    queryData: PaginatorModel,
  ): Promise<
    PaginatorOutputModel<Omit<UserOutputModel, 'email' | 'createdAt'>>
  > {
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;
    const searchLoginTerm = queryData.searchLoginTerm
      ? queryData.searchLoginTerm
      : '';

    const users = await this.usersQueryRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.login',
        'u.email',
        'u.password',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .leftJoinAndSelect('u.userBanByBloggers', 'ubb')
      .where('(u.login ILIKE :login)', { login: `%${searchLoginTerm}%` })
      .andWhere('(ubb.blogId = :blogId)', { blogId: blogId })
      .andWhere('(ubb.isBanned = :ban)', { ban: true })
      .orderBy(`u.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.usersQueryRepository
      .createQueryBuilder('u')
      .leftJoin('u.userBanByBloggers', 'ubb')
      .select('COUNT(u.id)')
      .where('(u.login ILIKE :login)', { login: `%${searchLoginTerm}%` })
      .andWhere('(ubb.blogId = :blogId)', { blogId: blogId })
      .andWhere('(ubb.isBanned = :ban)', { ban: true })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        users.map((user: User) => this.userMapperWithBanInfoForBlogger(user)),
      ),
    };
  }
  async getUserByLogin(login: string): Promise<User | null> {
    const user = await this.usersQueryRepository
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.login = :login', { login })
      .getOne();

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.usersQueryRepository
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.email = :email', { email })
      .getOne();

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const user = await this.usersQueryRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .leftJoinAndSelect('u.userBanByAdmin', 'uba')
      .where('(u.login = :loginOrEmail OR u.email = :loginOrEmail)', {
        loginOrEmail,
      })
      .andWhere('(uba.isBanned = :ban OR uba.isBanned IS NULL)', { ban: false })
      .getOne();

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByConfirmationCode(code: string): Promise<User | null> {
    const user = await this.usersQueryRepository
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.confirmationCode = :code', { code })
      .getOne();

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async checkUserPasswordForRecovery(
    recoveryCode: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.usersQueryRepository
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.confirmationCode = :recoveryCode', { recoveryCode })
      .getOne();

    if (!user) {
      return false;
    } else {
      return await bcrypt.compare(newPassword, user.password);
    }
  }
  async getUserById(
    id: string,
    manager?: EntityManager,
  ): Promise<UserOutputModel | null> {
    const queryBuilder = manager
      ? manager.createQueryBuilder(User, 'u')
      : this.usersQueryRepository.createQueryBuilder('u');

    const user = await queryBuilder
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .leftJoinAndSelect('u.userBanByAdmin', 'uba')
      .where('u.id = :id', { id })
      .getOne();

    if (!user) {
      return null;
    } else {
      return await this.userMapperWithBanInfoForAdmin(user);
    }
  }
  async getUserByIdForAuthMe(id: string): Promise<AuthMeOutputModel | null> {
    const user = await this.usersQueryRepository
      .createQueryBuilder()
      .select([
        'u.id',
        'u.login',
        'u.password',
        'u.email',
        'u.createdAt',
        'u.confirmationCode',
        'u.expirationDate',
        'u.isConfirmed',
      ])
      .from(User, 'u')
      .where('u.id = :id', { id })
      .getOne();

    if (!user) {
      return null;
    } else {
      return {
        email: user.email,
        login: user.login,
        userId: user.id,
      };
    }
  }
  async getOrmUserById(
    userId: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    const usersQueryRepository = manager
      ? manager.getRepository(User)
      : this.usersQueryRepository;

    const user = await usersQueryRepository.findOneBy({ id: userId });

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getOrmUserByIdWithBanInfo(
    userId: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    const usersQueryRepository = manager
      ? manager.getRepository(User)
      : this.usersQueryRepository;

    const user = await usersQueryRepository.findOne({
      where: { id: userId },
      relations: ['userBanByAdmin', 'userBanByBloggers'],
    });

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async userMapperWithBanInfoForAdmin(user: User): Promise<UserOutputModel> {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      banInfo: {
        isBanned: user.userBanByAdmin.isBanned,
        banDate: user.userBanByAdmin.banDate
          ? user.userBanByAdmin.banDate.toISOString()
          : null,
        banReason: user.userBanByAdmin.banReason,
      },
    };
  }
  async userMapperWithBanInfoForBlogger(
    user: User,
  ): Promise<Omit<UserOutputModel, 'email' | 'createdAt'>> {
    return {
      id: user.id,
      login: user.login,
      banInfo: {
        isBanned: user.userBanByBloggers.isBanned,
        banDate: user.userBanByBloggers.banDate
          ? user.userBanByBloggers.banDate.toISOString()
          : null,
        banReason: user.userBanByBloggers.banReason,
      },
    };
  }
}
