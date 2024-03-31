import { Injectable } from '@nestjs/common';
import {
  UserOutputModel,
  UserAccountModel,
  userMapper,
} from '../api/models/user.output.model';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectDataSource()
    protected dataSource: DataSource,
  ) {}
  async createUser(newUser: UserAccountModel): Promise<UserOutputModel> {
    // const query = `INSERT INTO public."Users"(
    //         "id", "login", "password", "email", "createdAt", "confirmationCode", "expirationDate", "isConfirmed")
    //         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
    //
    // await this.dataSource.query(query, [
    //   newUser.id,
    //   newUser.login,
    //   newUser.password,
    //   newUser.email,
    //   newUser.createdAt,
    //   newUser.confirmationCode,
    //   newUser.expirationDate,
    //   newUser.isConfirmed,
    // ]);

    await this.usersRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(newUser)
      .execute();

    return userMapper(newUser);
  }
  async deleteUser(id: string): Promise<boolean> {
    // const query = `DELETE FROM public."Users"
    //          WHERE "id" = $1`;
    //
    // const resultDeleteUser = await this.dataSource.query(query, [id]);
    //
    // return resultDeleteUser[1] === 1;

    const resultDeleteUser = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id = :id', { id })
      .execute();

    return resultDeleteUser.affected === 1;
  }
  async updateConfirmationCode(
    email: string,
    newCode: string,
    newExpirationDate: string,
  ): Promise<boolean> {
    // const query = `UPDATE public."Users"
    //         SET "confirmationCode"=$1, "expirationDate"=$2
    //         WHERE "email" = $3`;
    //
    // const resultUpdateCode = await this.dataSource.query(query, [
    //   newCode,
    //   newExpirationDate,
    //   email,
    // ]);
    //
    // return resultUpdateCode[1] === 1;

    const resultUpdateCode = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ confirmationCode: newCode, expirationDate: newExpirationDate })
      .where('email = :email', { email })
      .execute();

    return resultUpdateCode.affected === 1;
  }
  async updateConfirmStatus(id: string): Promise<boolean> {
    // const query = `UPDATE public."Users"
    //         SET "isConfirmed"=$1
    //         WHERE "id" = $2`;
    //
    // const resultUpdateStatus = await this.dataSource.query(query, [true, id]);
    //
    // return resultUpdateStatus[1] === 1;

    const resultUpdateStatus = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ isConfirmed: true })
      .where('id = :id', { id })
      .execute();

    return resultUpdateStatus.affected === 1;
  }
  async updatePasswordForRecovery(
    recoveryCode: string,
    newPassword: string,
  ): Promise<boolean> {
    // const query = `UPDATE public."Users"
    //         SET "password"=$1
    //         WHERE "confirmationCode" = $2`;
    //
    // const resultUpdatePassword = await this.dataSource.query(query, [
    //   newPassword,
    //   recoveryCode,
    // ]);
    //
    // return resultUpdatePassword[1] === 1;

    const resultUpdatePassword = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: newPassword })
      .where('confirmationCode = :recoveryCode', { recoveryCode })
      .execute();

    return resultUpdatePassword.affected === 1;
  }
}
