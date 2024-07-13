import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { BlogsQueryRepository } from '../../features/blogs/infrastructure/blogs.query-repository';

@Injectable()
export class BindBlogValidatorPipe implements PipeTransform {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async transform(blogId: string) {
    const isBindBlog: boolean =
      await this.blogsQueryRepository.checkBindBlog(blogId);

    if (isBindBlog) {
      throw new BadRequestException('Blog have an owner');
    }

    return blogId;
  }
}
