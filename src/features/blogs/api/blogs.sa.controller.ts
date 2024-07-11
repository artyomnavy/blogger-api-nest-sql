import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { CommandBus } from '@nestjs/cqrs';
import { HTTP_STATUSES } from '../../../common/utils';
import { BindBlogValidatorPipe } from '../../../common/pipes/bind-blog-validator.pipe';
import { UsersQueryRepository } from '../../users/infrastructure/users.query-repository';
import { BindBlogWithUserCommand } from '../application/use-cases/bind-blog.use-case';

@Controller('sa/blogs')
export class BlogsSAController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected usersQueryRepository: UsersQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  @UseGuards(BasicAuthGuard)
  async getAllBlogs(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return blogs;
  }
  @Put(':blogId/bind-with-user/:userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async bindBlogWithUser(
    @Param('blogId', new ParseUUIDPipe({ version: '4' }), BindBlogValidatorPipe)
    blogId: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    const user = await this.usersQueryRepository.getOrmUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isBind = await this.commandBus.execute(
      new BindBlogWithUserCommand(blogId, user),
    );

    if (isBind) {
      return;
    } else {
      throw new Error('Blog not bind with user');
    }
  }
}
