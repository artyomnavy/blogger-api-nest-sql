import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsService } from '../../posts/application/posts.service';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import { CreateAndUpdateBlogModel } from './models/blog.input.model';
import { CreateAndUpdatePostModel } from '../../posts/api/models/post.input.model';
import { PostOutputModel } from '../../posts/api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { HTTP_STATUSES } from '../../../utils';
import { ObjectIdPipe } from '../../../common/pipes/object-id.pipe';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { Request } from 'express';

@Controller('blogs')
export class BlogsController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
    protected postsService: PostsService,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return blogs;
  }
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createBlog(
    @Body() createModel: CreateAndUpdateBlogModel,
  ): Promise<BlogOutputModel> {
    const newBlog = await this.commandBus.execute(
      new CreateBlogCommand(createModel),
    );

    return newBlog;
  }
  @Get(':id/posts')
  async getPostsForBlog(
    @Param('id', ObjectIdPipe) blogId: string,
    @Query() query: PaginatorModel,
    @Req() req: Request,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const userId = req.userId;

    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const posts = await this.postsQueryRepository.getPostsByBlogId({
      query,
      blogId,
      userId,
    });

    return posts;
  }
  @Post(':id/posts')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPostForBlog(
    @Param('id', ObjectIdPipe) blogId: string,
    @Body() createModel: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const createData: CreateAndUpdatePostModel = {
      ...createModel,
      blogId,
    };

    const post = await this.postsService.createPost(createData);

    return post;
  }
  @Get(':id')
  async getBlog(
    @Param('id', ObjectIdPipe) blogId: string,
  ): Promise<BlogOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    } else {
      return blog;
    }
  }
  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlog(
    @Param('id', ObjectIdPipe) blogId: string,
    @Body() updateModel: CreateAndUpdateBlogModel,
  ) {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const isUpdated = await this.commandBus.execute(
      new UpdateBlogCommand(blogId, updateModel),
    );

    if (isUpdated) {
      return;
    }
  }
  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteBlog(@Param('id', ObjectIdPipe) blogId: string) {
    const isDeleted = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new NotFoundException('Blog not found');
    }
  }
}
