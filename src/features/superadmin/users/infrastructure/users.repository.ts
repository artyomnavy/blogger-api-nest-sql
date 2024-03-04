import { Injectable } from '@nestjs/common';
import {
  UserOutputModel,
  userMapper,
  UserAccountModel,
} from '../api/models/user.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../domain/user.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async createUser(newUser: UserAccountModel): Promise<UserOutputModel> {
    const resultCreateUser = await this.userModel.create(newUser);
    return userMapper(resultCreateUser);
  }
  async deleteUser(id: string): Promise<boolean> {
    const resultDeleteUser = await this.userModel.deleteOne({
      _id: new ObjectId(id),
    });
    return resultDeleteUser.deletedCount === 1;
  }
  async updateConfirmationCode(
    email: string,
    newCode: string,
    newExpirationDate: Date,
  ): Promise<boolean> {
    const resultUpdateConfirmationCode = await this.userModel.updateOne(
      { 'accountData.email': email },
      {
        $set: {
          'emailConfirmation.confirmationCode': newCode,
          'emailConfirmation.expirationDate': newExpirationDate,
        },
      },
    );
    return resultUpdateConfirmationCode.modifiedCount === 1;
  }
  async updateConfirmStatus(_id: ObjectId): Promise<boolean> {
    const resultUpdateConfirmStatus = await this.userModel.updateOne(
      { _id },
      {
        $set: { 'emailConfirmation.isConfirmed': true },
      },
    );
    return resultUpdateConfirmStatus.modifiedCount === 1;
  }
  async updatePasswordForRecovery(
    recoveryCode: string,
    newPassword: string,
  ): Promise<boolean> {
    const resultUpdatePassword = await this.userModel.updateOne(
      { 'emailConfirmation.confirmationCode': recoveryCode },
      {
        $set: {
          'accountData.password': newPassword,
        },
      },
    );
    return resultUpdatePassword.modifiedCount === 1;
  }
}
