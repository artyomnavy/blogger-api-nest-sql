import { Injectable } from '@nestjs/common';
import {
  UserAccountModel,
  userMapper,
  UserOutputModel,
} from '../api/models/user.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import bcrypt from 'bcrypt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthMeOutputModel } from '../../auth/api/models/auth.output.model';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async getAllUsers(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<UserOutputModel>> {
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? queryData.sortDirection
      : 'desc';
    const pageNumber = queryData.pageNumber ? queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? queryData.pageSize : 10;
    const searchLoginTerm = queryData.searchLoginTerm
      ? queryData.searchLoginTerm
      : '';
    const searchEmailTerm = queryData.searchEmailTerm
      ? queryData.searchEmailTerm
      : '';

    const query = `SELECT
                "id", "login", "email", "password", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "login" ILIKE $1 OR "email" ILIKE $2
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $3 OFFSET $4`;

    const users = await this.dataSource.query(query, [
      `%${searchLoginTerm}%`,
      `%${searchEmailTerm}%`,
      +pageSize,
      (+pageNumber - 1) * +pageSize,
    ]);

    const totalCount = await this.dataSource.query(
      `SELECT
                COUNT(*) FROM public."Users"
                WHERE "login" ILIKE $1 OR "email" ILIKE $2`,
      [`%${searchLoginTerm}%`, `%${searchEmailTerm}%`],
    );

    const pagesCount = Math.ceil(+totalCount[0].count / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount[0].count,
      items: users.map(userMapper),
    };
  }
  async getUserByLogin(login: string): Promise<UserOutputModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "login" = $1`;

    const user = await this.dataSource.query(query, [login]);

    if (!user.length) {
      return null;
    } else {
      return userMapper(user[0]);
    }
  }
  async getUserByEmail(email: string): Promise<UserAccountModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "email" = $1`;

    const user = await this.dataSource.query(query, [email]);

    if (!user.length) {
      return null;
    } else {
      return user[0];
    }
  }
  async getUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserAccountModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "login" = $1 OR "email" = $1`;

    const user = await this.dataSource.query(query, [loginOrEmail]);

    if (!user.length) {
      return null;
    } else {
      return user[0];
    }
  }
  async getUserByConfirmationCode(
    code: string,
  ): Promise<UserAccountModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "confirmationCode" = $1`;

    const user = await this.dataSource.query(query, [code]);

    if (!user.length) {
      return null;
    } else {
      return user[0];
    }
  }
  async checkUserPasswordForRecovery(
    recoveryCode: string,
    newPassword: string,
  ): Promise<boolean> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "confirmationCode" = $1`;

    const user = await this.dataSource.query(query, [recoveryCode]);

    if (!user.length) {
      return false;
    } else {
      return await bcrypt.compare(newPassword, user[0].password);
    }
  }
  async getUserById(id: string): Promise<UserOutputModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "id" = $1`;

    const user = await this.dataSource.query(query, [id]);

    if (!user.length) {
      return null;
    } else {
      return userMapper(user[0]);
    }
  }
  async getUserByIdForAuthMe(id: string): Promise<AuthMeOutputModel | null> {
    const query = `SELECT
                "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed"
                FROM public."Users"
                WHERE "id" = $1`;

    const user = await this.dataSource.query(query, [id]);

    if (!user.length) {
      return null;
    } else {
      return {
        email: user[0].email,
        login: user[0].login,
        userId: user[0].id,
      };
    }
  }
}
