import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { BlogWithOwnerAndBanInfoOutputModel } from './models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { HTTP_STATUSES, ResultCode } from '../../../common/utils';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { BindBlogWithUserCommand } from '../application/use-cases/bind-blog.use-case';
import { resultCodeToHttpException } from '../../../common/exceptions/result-code-to-http-exception';
import { UpdateBlogBanInfoByAdminCommand } from '../../bans/application/use-cases/update-blog-ban-by-admin.use-case';
import { UpdateBlogBanByAdminModel } from '../../bans/api/models/ban.input.model';

@Controller('sa/blogs')
export class BlogsSAController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllBlogsForAdmin(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogWithOwnerAndBanInfoOutputModel>> {
    const blogs =
      await this.blogsQueryRepository.getAllBlogsWithOwnerAndBanInfoForAdmin(
        query,
      );

    return blogs;
  }
  @Put(':blogId/bind-with-user/:userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async bindBlogWithUser(
    @Param('blogId', new ParseUUIDPipe({ version: '4' }))
    blogId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    const result = await this.commandBus.execute(
      new BindBlogWithUserCommand(blogId, userId),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message, result.field);
    }

    return;
  }
  @Put(':blogId/ban')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlogBanInfoByAdmin(
    @Param('blogId', new ParseUUIDPipe({ version: '4' })) blogId: string,
    @Body() updateData: UpdateBlogBanByAdminModel,
  ) {
    const result = await this.commandBus.execute(
      new UpdateBlogBanInfoByAdminCommand(blogId, updateData),
    );

    if (result.code !== ResultCode.SUCCESS) {
      resultCodeToHttpException(result.code, result.message);
    }

    return;
  }
}
