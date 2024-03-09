import { Injectable } from '@nestjs/common';
import {
  UserOutputModel,
  UserAccountModel,
  userMapper,
} from '../api/models/user.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createUser(newUser: UserAccountModel): Promise<UserOutputModel> {
    const query = `INSERT INTO public."Users"(
            "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

    await this.dataSource.query(query, [
      newUser.id,
      newUser.login,
      newUser.password,
      newUser.email,
      newUser.createdAt,
      newUser.confirmationCode,
      newUser.expirationDate,
      newUser.isConfirmed,
    ]);

    return userMapper(newUser);
  }
  async deleteUser(id: string): Promise<boolean> {
    const query = `DELETE FROM public."Users"
             WHERE "id" = $1`;

    const resultDeleteUser = await this.dataSource.query(query, [id]);

    if (resultDeleteUser[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
  async updateConfirmationCode(
    email: string,
    newCode: string,
    newExpirationDate: string,
  ): Promise<boolean> {
    const query = `UPDATE public."Users"
            SET "confirmationCode"=$1, "expirationDate"=$2
            WHERE "email" = $3`;

    const resultUpdateCode = await this.dataSource.query(query, [
      newCode,
      newExpirationDate,
      email,
    ]);

    if (resultUpdateCode[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
  async updateConfirmStatus(id: string): Promise<boolean> {
    const query = `UPDATE public."Users"
            SET "isConfirmed"=$1
            WHERE "id" = $2`;

    const resultUpdateStatus = await this.dataSource.query(query, [true, id]);

    if (resultUpdateStatus[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
  async updatePasswordForRecovery(
    recoveryCode: string,
    newPassword: string,
  ): Promise<boolean> {
    const query = `UPDATE public."Users"
            SET "password"=$1
            WHERE "confirmationCode" = $2`;

    const resultUpdatePassword = await this.dataSource.query(query, [
      newPassword,
      recoveryCode,
    ]);

    if (resultUpdatePassword[1] === 1) {
      return true;
    } else {
      return false;
    }
  }
}
