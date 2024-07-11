import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { BlogsQueryRepository } from '../../features/blogs/infrastructure/blogs.query-repository';
import { Blog } from '../../features/blogs/domain/blog.entity';

@Injectable()
export class BindBlogValidatorPipe implements PipeTransform {
  constructor(private readonly blogsQueryRepository: BlogsQueryRepository) {}
  async transform(id: string) {
    const isBindBlog: Blog | null =
      await this.blogsQueryRepository.checkBindBlog(id);

    if (isBindBlog) {
      throw new BadRequestException('Blog have an owner');
    }

    return id;
  }
}
