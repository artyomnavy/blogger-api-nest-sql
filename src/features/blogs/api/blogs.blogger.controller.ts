import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import { CreateAndUpdateBlogModel } from './models/blog.input.model';
import { CreateAndUpdatePostModel } from '../../posts/api/models/post.input.model';
import { PostOutputModel } from '../../posts/api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { HTTP_STATUSES } from '../../../common/utils';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { UpdatePostCommand } from '../../posts/application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../posts/application/use-cases/delete-post.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { CreatePostCommand } from '../../posts/application/use-cases/create-post.use-case';
import { JwtBearerAuthGuard } from '../../../common/guards/jwt-bearer-auth-guard.service';
import { CurrentUserId } from '../../../common/decorators/current-user-id.param.decorator';
import { BlogExistsPipe } from '../../../common/pipes/blog-exists.pipe';
import { PostExistsPipe } from '../../../common/pipes/post-exists.pipe';

@Controller('blogger/blogs')
export class BlogsBloggerController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}
  @Get()
  @UseGuards(JwtBearerAuthGuard)
  async getAllBlogs(
    @CurrentUserId() userId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query, userId);

    return blogs;
  }
  @Post()
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createBlog(
    @CurrentUserId() userId: string,
    @Body() createModel: CreateAndUpdateBlogModel,
  ): Promise<BlogOutputModel> {
    const newBlog = await this.commandBus.execute(
      new CreateBlogCommand(createModel, userId),
    );

    return newBlog;
  }
  @Put(':blogId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe, BlogExistsPipe) blogId: string,
    @Body() updateModel: CreateAndUpdateBlogModel,
  ) {
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const isUpdated = await this.commandBus.execute(
      new UpdateBlogCommand(blogId, updateModel),
    );

    if (isUpdated) {
      return;
    } else {
      throw new Error('Blog not updated');
    }
  }
  @Delete(':blogId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe, BlogExistsPipe) blogId: string,
  ) {
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const isDeleted = await this.commandBus.execute(
      new DeleteBlogCommand(blogId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new Error('Blog not deleted');
    }
  }
  @Get(':blogId/posts')
  @UseGuards(JwtBearerAuthGuard)
  async getPostsForBlog(
    @Param('blogId', UuidPipe, BlogExistsPipe) blogId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const posts = await this.postsQueryRepository.getPostsByBlogId({
      query,
      blogId,
    });

    return posts;
  }
  @Post(':blogId/posts')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPostForBlog(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe) blogId: string,
    @Body() createModel: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const newPost = await this.commandBus.execute(
      new CreatePostCommand(blog.id, blog.name, createModel),
    );

    return newPost;
  }
  @Put(':blogId/posts/:postId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updatePost(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe, BlogExistsPipe) blogId: string,
    @Param('postId', UuidPipe, PostExistsPipe) postId: string,
    @Body() updateModel: CreateAndUpdatePostModel,
  ) {
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const isUpdated = await this.commandBus.execute(
      new UpdatePostCommand(postId, updateModel),
    );

    if (isUpdated) {
      return;
    } else {
      throw new Error('Post not updated');
    }
  }
  @Delete(':blogId/posts/:postId')
  @UseGuards(JwtBearerAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deletePost(
    @CurrentUserId() userId: string,
    @Param('blogId', UuidPipe, BlogExistsPipe) blogId: string,
    @Param('postId', UuidPipe, PostExistsPipe) postId: string,
  ) {
    const isOwnerBlog = await this.blogsQueryRepository.checkOwnerBlog(
      userId,
      blogId,
    );

    if (!isOwnerBlog) {
      throw new ForbiddenException('Blog not owned by user');
    }

    const isDeleted = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new Error('Post not delete');
    }
  }
}
