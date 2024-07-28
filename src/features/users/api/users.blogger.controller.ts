import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { UpdateUserBanByBloggerModel } from './models/user.input.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { UserOutputModel } from './models/user.output.model';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { CommandBus } from '@nestjs/cqrs';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';
import { UpdateUserBanInfoByBloggerCommand } from '../application/use-cases/update-user-ban-by-blogger.use-case';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';

@Controller('blogger/users')
export class UsersBloggerController {
  constructor(
    protected usersQueryRepository: UsersQueryRepository,
    protected blogsQueryRepository: BlogsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get('/blog/:blogId')
  @UseGuards(JwtBearerAuthGuard)
  async getAllBannedUsersForBlog(
    @CurrentUserId() blogOwnerId: string,
    @Param('blogId', new ParseUUIDPipe({ version: '4' })) blogId: string,
    @Query() query: PaginatorModel,
  ): Promise<
    PaginatorOutputModel<Omit<UserOutputModel, 'email' | 'createdAt'>>
  > {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      blogOwnerId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const users = await this.usersQueryRepository.getAllBannedUsersForBlog(
      blogId,
      query,
    );

    return users;
  }
  @Put(':userId/ban')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateUserBanInfoByBlogger(
    @CurrentUserId() blogOwnerId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() updateData: UpdateUserBanByBloggerModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdateUserBanInfoByBloggerCommand(blogOwnerId, userId, updateData),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
}
