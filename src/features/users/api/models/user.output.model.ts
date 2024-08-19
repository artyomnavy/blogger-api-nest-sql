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
  ) {}
}
