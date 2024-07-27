import { UserBanByAdmin } from '../../domain/user-ban-by-admin.entity';

export class UserOutputModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
    banReason: string | null;
  };
}

export class UserAccountModel {
  id: string;
  login: string;
  password: string;
  email: string;
  createdAt: Date;
  confirmationCode: string | null;
  expirationDate: Date | null;
  isConfirmed: boolean;
  userBanByAdmin: UserBanByAdmin;
}

export class User {
  constructor(
    public id: string,
    public login: string,
    public password: string,
    public email: string,
    public createdAt: Date,
    public confirmationCode: string | null,
    public expirationDate: Date | null,
    public isConfirmed: boolean,
    public userBanByAdmin: UserBanByAdmin,
  ) {}
}

export class BanInfo {
  constructor(
    public id: string,
    public isBanned: boolean,
    public banDate: Date | null,
    public banReason: string | null,
  ) {}
}

export const userMapper = (user: User): UserOutputModel => {
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
};
