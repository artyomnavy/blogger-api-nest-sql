import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { BlogsQueryRepository } from '../infrastructure/blogs.query-repository';
import { PostsQueryRepository } from '../../posts/infrastructure/posts.query-repository';
import { BlogOutputModel } from './models/blog.output.model';
import { PostOutputModel } from '../../posts/api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { UuidPipe } from '../../../common/pipes/uuid.pipe';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return blogs;
  }
  @Get(':blogId')
  async getBlog(
    @Param('blogId', UuidPipe) blogId: string,
  ): Promise<BlogOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    } else {
      return blog;
    }
  }
  @Get(':blogId/posts')
  async getPostsForBlog(
    @Param('blogId', UuidPipe) blogId: string,
    @Query() query: PaginatorModel,
    @Req() req,
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
}
