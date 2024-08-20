import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { CreateUserModel } from './models/user.input.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { UserOutputModel } from './models/user.output.model';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { DeleteUserCommand } from '../application/use-cases/delete-user.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserByAdminCommand } from '../application/use-cases/create-user-by-admin.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { UpdateUserBanInfoByAdminCommand } from '../../bans/application/use-cases/update-user-ban-by-admin.use-case';
import { UpdateUserBanByAdminModel } from '../../bans/api/models/ban.input.model';

@Controller('sa/users')
export class UsersSAController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllUsers(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<UserOutputModel>> {
    const users = await this.usersQueryRepository.getAllUsers(query);

    return users;
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createUserByAdmin(
    @Body() createModel: CreateUserModel,
  ): Promise<UserOutputModel> {
    const result = await this.commandBus.execute(
      new CreateUserByAdminCommand(createModel),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return result.data;
  }
  @Put(':userId/ban')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateUserBanInfoByAdmin(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() updateData: UpdateUserBanByAdminModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdateUserBanInfoByAdminCommand(userId, updateData),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
  @Delete(':userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteUser(@Param('userId', UuidPipe) userId: string) {
    const isDeleted = await this.commandBus.execute(
      new DeleteUserCommand(userId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new NotFoundException('User not found');
    }
  }
}
