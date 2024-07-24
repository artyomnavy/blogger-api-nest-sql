import { Injectable } from '@nestjs/common';
import { UserAccountModel } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../domain/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async createUser(
    newUser: UserAccountModel,
    manager?: EntityManager,
  ): Promise<string> {
    const queryBuilder = manager
      ? manager.createQueryBuilder()
      : this.usersRepository.createQueryBuilder();

    const resultCreateUser = await queryBuilder
      .createQueryBuilder()
      .insert()
      .into(User)
      .values(newUser)
      .execute();

    return resultCreateUser.raw[0].id;
  }
  async deleteUser(id: string): Promise<boolean> {
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
    const resultUpdateCode = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ confirmationCode: newCode, expirationDate: newExpirationDate })
      .where('email = :email', { email })
      .execute();

    return resultUpdateCode.affected === 1;
  }
  async updateConfirmStatus(id: string): Promise<boolean> {
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
    const resultUpdatePassword = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ password: newPassword })
      .where('confirmationCode = :recoveryCode', { recoveryCode })
      .execute();

    return resultUpdatePassword.affected === 1;
  }
}
