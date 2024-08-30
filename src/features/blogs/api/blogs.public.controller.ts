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
import { updateBlogImagesUrlsForOutput } from '../../files/api/models/blog-image.output.model';
import { updatePostImagesUrlsForOutput } from '../../files/api/models/post-image.output.model';

@Controller('blogs')
export class BlogsPublicController {
  constructor(
    protected blogsQueryRepository: BlogsQueryRepository,
    protected postsQueryRepository: PostsQueryRepository,
  ) {}

  @Get()
  async getAllBlogs(
    @Req() req,
    @Query() query: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const blogs = await this.blogsQueryRepository.getAllBlogs(query);

    return {
      ...blogs,
      items: blogs.items.map((blog) => ({
        ...blog,
        images: updateBlogImagesUrlsForOutput(
          req.protocol,
          req.get('host'),
          blog.images,
        ),
      })),
    };
  }
  @Get(':blogId')
  async getBlog(
    @Req() req,
    @Param('blogId', UuidPipe) blogId: string,
  ): Promise<BlogOutputModel> {
    const blog = await this.blogsQueryRepository.getBlogById(blogId);

    if (!blog) {
      throw new NotFoundException('Blog not found');
    } else {
      return {
        ...blog,
        images: updateBlogImagesUrlsForOutput(
          req.protocol,
          req.get('host'),
          blog.images,
        ),
      };
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

    const posts = await this.postsQueryRepository.getPostsBlogForPublic({
      query,
      blogId,
      userId,
    });

    return {
      ...posts,
      items: posts.items.map((post) => ({
        ...post,
        images: {
          main: updatePostImagesUrlsForOutput(
            req.protocol,
            req.get('host'),
            post.images.main,
          ).main,
        },
      })),
    };
  }
}
