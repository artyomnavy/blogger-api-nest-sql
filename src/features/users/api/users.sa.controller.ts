import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { CreateUserModel } from './models/user.input.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { UserOutputModel } from './models/user.output.model';
import { HTTP_STATUSES } from '../../../common/utils';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { DeleteUserCommand } from '../application/use-cases/delete-user.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserByAdminCommand } from '../application/use-cases/create-user-by-admin.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';

@Controller('sa/users')
export class UsersController {
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

    if (!users) {
      throw new Error('Query all users to database is failed');
    }

    return users;
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createUserByAdmin(
    @Body() createModel: CreateUserModel,
  ): Promise<UserOutputModel> {
    const newUser = await this.commandBus.execute(
      new CreateUserByAdminCommand(createModel),
    );

    return newUser;
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
