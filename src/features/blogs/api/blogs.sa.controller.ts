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
import { HTTP_STATUSES } from '../../../utils';
import { BasicAuthGuard } from '../../../common/guards/basic-auth.guard';
import { CreateBlogCommand } from '../application/use-cases/create-blog.use-case';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteBlogCommand } from '../application/use-cases/delete-blog.use-case';
import { UpdateBlogCommand } from '../application/use-cases/update-blog.use-case';
import { UpdatePostCommand } from '../../posts/application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../posts/application/use-cases/delete-post.use-case';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';
import { CreatePostCommand } from '../../posts/application/use-cases/create-post.use-case';

@Controller('sa/blogs')
export class BlogsSAController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
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
  @Put(':blogId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updateBlog(
    @Param('blogId', UuidPipe) blogId: string,
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
    } else {
      throw new Error('Blog not updated');
    }
  }
  @Delete(':blogId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deleteBlog(@Param('blogId', UuidPipe) blogId: string) {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
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
  @UseGuards(BasicAuthGuard)
  async getPostsForBlog(
    @Param('blogId', UuidPipe) blogId: string,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<PostOutputModel>> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const posts = await this.postsQueryRepository.getPostsByBlogId({
      query,
      blogId,
    });

    return posts;
  }
  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.CREATED_201)
  async createPostForBlog(
    @Param('blogId', UuidPipe) blogId: string,
    @Body() createModel: CreateAndUpdatePostModel,
  ): Promise<PostOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const newPost = await this.commandBus.execute(
      new CreatePostCommand(blogId, blog.name, createModel),
    );

    return newPost;
  }
  @Put(':blogId/posts/:postId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async updatePost(
    @Param('blogId', UuidPipe) blogId: string,
    @Param('postId', UuidPipe) postId: string,
    @Body() updateModel: CreateAndUpdatePostModel,
  ) {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const post = await this.postsQueryRepository.getPostById(postId);

    if (!post) {
      throw new NotFoundException('Post not found');
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
  @UseGuards(BasicAuthGuard)
  @HttpCode(HTTP_STATUSES.NO_CONTENT_204)
  async deletePost(
    @Param('blogId', UuidPipe) blogId: string,
    @Param('postId', UuidPipe) postId: string,
  ) {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const isDeleted = await this.commandBus.execute(
      new DeletePostCommand(postId),
    );

    if (isDeleted) {
      return;
    } else {
      throw new NotFoundException('Post not found');
    }
  }
}
