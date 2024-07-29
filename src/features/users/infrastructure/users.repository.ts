import { Injectable } from '@nestjs/common';
import { UserAccountModel } from '../api/models/user.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../domain/user.entity';
import { UserBanByAdmin } from '../domain/user-ban-by-admin.entity';
import { UserBanByBloggers } from '../domain/user-ban-by-blogger.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
  async createUser(
    newUser: UserAccountModel,
    userBanByAdmin: UserBanByAdmin,
    userBanByBlogger: UserBanByBloggers,
    manager?: EntityManager,
  ): Promise<string> {
    const usersRepository = manager
      ? manager.getRepository(User)
      : this.usersRepository;

    const user = new User();

    user.id = newUser.id;
    user.login = newUser.login;
    user.email = newUser.email;
    user.password = newUser.password;
    user.createdAt = newUser.createdAt;
    user.confirmationCode = newUser.confirmationCode;
    user.expirationDate = newUser.expirationDate;
    user.isConfirmed = newUser.isConfirmed;

    user.userBanByAdmin = userBanByAdmin;
    user.userBanByBloggers = userBanByBlogger;

    const resultCreateUser = await usersRepository.save(user);

    return resultCreateUser.id;
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
