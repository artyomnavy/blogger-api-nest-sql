import { Injectable } from '@nestjs/common';
import {
  UserAccountModel,
  userMapper,
  UserOutputModel,
} from '../api/models/user.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import bcrypt from 'bcrypt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthMeOutputModel } from '../../auth/api/models/auth.output.model';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersQueryRepository: Repository<User>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}
  async getAllUsers(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<UserOutputModel>> {
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection!
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
      .where('(u.login ILIKE :login OR u.email ILIKE :email)', {
        login: `%${searchLoginTerm}%`,
        email: `%${searchEmailTerm}%`,
      })
      .orderBy(`u.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.usersQueryRepository
      .createQueryBuilder('u')
      .select('COUNT(u.id)')
      .where('(u.login ILIKE :login OR u.email ILIKE :email)', {
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
      items: users.map(userMapper),
    };
  }
  async getUserByLogin(login: string): Promise<UserOutputModel | null> {
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
      return userMapper(user);
    }
  }
  async getUserByEmail(email: string): Promise<UserAccountModel | null> {
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
  async getUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserAccountModel | null> {
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
      .where('u.login = :loginOrEmail OR u.email = :loginOrEmail', {
        loginOrEmail,
      })
      .getOne();

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByConfirmationCode(
    code: string,
  ): Promise<UserAccountModel | null> {
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
  async getUserById(id: string): Promise<UserOutputModel | null> {
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
      return userMapper(user);
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
}
