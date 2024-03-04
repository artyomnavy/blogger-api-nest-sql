import { Injectable } from '@nestjs/common';
import {
  UserAccountModel,
  userMapper,
  UserOutputModel,
} from '../api/models/user.output.model';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../domain/user.entity';
import { Model } from 'mongoose';
import { PaginatorModel } from '../../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../../common/models/paginator.output.model';
import bcrypt from 'bcrypt';
import { ObjectId } from 'mongodb';
import { AuthMeOutputModel } from '../../../public/auth/api/models/auth.output.model';

@Injectable()
export class UsersQueryRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async getAllUsers(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<UserOutputModel>> {
    const sortBy = queryData.sortBy
      ? `accountData.${queryData.sortBy}`
      : 'accountData.createdAt';
    const sortDirection = queryData.sortDirection
      ? queryData.sortDirection
      : 'desc';
    const pageNumber = queryData.pageNumber ? queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? queryData.pageSize : 10;
    const searchLoginTerm = queryData.searchLoginTerm
      ? queryData.searchLoginTerm
      : null;
    const searchEmailTerm = queryData.searchEmailTerm
      ? queryData.searchEmailTerm
      : null;

    let filterLogin = {};
    let filterEmail = {};

    if (searchLoginTerm) {
      filterLogin = {
        'accountData.login': {
          $regex: searchLoginTerm,
          $options: 'i',
        },
      };
    }

    if (searchEmailTerm) {
      filterEmail = {
        'accountData.email': {
          $regex: searchEmailTerm,
          $options: 'i',
        },
      };
    }

    const filter = {
      $or: [filterLogin, filterEmail],
    };

    const users = await this.userModel
      .find(filter)
      .sort({
        [sortBy]: sortDirection === 'desc' ? -1 : 1,
      })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    const totalCount = await this.userModel.countDocuments(filter);

    const pagesCount = Math.ceil(+totalCount / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount,
      items: users.map(userMapper),
    };
  }
  async getUserByLogin(login: string): Promise<UserOutputModel | null> {
    const user = await this.userModel.findOne({ 'accountData.login': login });

    if (!user) {
      return null;
    } else {
      return userMapper(user);
    }
  }
  async getUserByEmail(email: string): Promise<UserAccountModel | null> {
    const user = await this.userModel.findOne({ 'accountData.email': email });

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<UserAccountModel | null> {
    const filter = {
      $or: [
        { 'accountData.login': loginOrEmail },
        { 'accountData.email': loginOrEmail },
      ],
    };

    const user = await this.userModel.findOne(filter);

    if (!user) {
      return null;
    } else {
      return user;
    }
  }
  async getUserByConfirmationCode(
    code: string,
  ): Promise<UserAccountModel | null> {
    const user = await this.userModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });

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
    const user = await this.userModel.findOne({
      'emailConfirmation.confirmationCode': recoveryCode,
    });

    if (!user) {
      return false;
    } else {
      return await bcrypt.compare(newPassword, user.accountData.password);
    }
  }
  async getUserById(id: string): Promise<UserOutputModel | null> {
    const user = await this.userModel.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return null;
    } else {
      return userMapper(user);
    }
  }
  async getUserByIdForAuthMe(id: string): Promise<AuthMeOutputModel | null> {
    const user = await this.userModel.findOne({ _id: new ObjectId(id) });

    if (!user) {
      return null;
    } else {
      return {
        email: user.accountData.email,
        login: user.accountData.login,
        userId: user._id.toString(),
      };
    }
  }
}
