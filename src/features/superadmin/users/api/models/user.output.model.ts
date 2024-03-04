import { ObjectId } from 'mongodb';
import { UserDocument } from '../../domain/user.entity';

export class UserOutputModel {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export class UserModel {
  login: string;
  password: string;
  email: string;
  createdAt: Date;
}

export class EmailConfirmationModel {
  confirmationCode: string | null;
  expirationDate: Date | null;
  isConfirmed: boolean;
}

export class UserAccountModel {
  _id: ObjectId;
  accountData: UserModel;
  emailConfirmation: EmailConfirmationModel;
}

export class User {
  constructor(
    public _id: ObjectId,
    public accountData: UserModel,
    public emailConfirmation: EmailConfirmationModel,
  ) {}
}

export const userMapper = (user: UserDocument): UserOutputModel => {
  return {
    id: user._id.toString(),
    login: user.accountData.login,
    email: user.accountData.email,
    createdAt: user.accountData.createdAt.toISOString(),
  };
};
