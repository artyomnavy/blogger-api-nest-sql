import { Injectable } from '@nestjs/common';
import {
  blogMapper,
  BlogModel,
  BlogOutputModel,
} from '../api/models/blog.output.model';
import { CreateAndUpdateBlogModel } from '../api/models/blog.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../domain/blog.entity';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
  ) {}
  async createBlog(newBlog: BlogModel): Promise<BlogOutputModel> {
    await this.blogsRepository
      .createQueryBuilder()
      .insert()
      .into(Blog)
      .values(newBlog)
      .execute();

    return blogMapper(newBlog);
  }
  async updateBlog(
    id: string,
    updateData: CreateAndUpdateBlogModel,
  ): Promise<boolean> {
    const resultUpdateBlog = await this.blogsRepository
      .createQueryBuilder()
      .update(Blog)
      .set({
        name: updateData.name,
        description: updateData.description,
        websiteUrl: updateData.websiteUrl,
      })
      .where('id = :id', { id })
      .execute();

    return resultUpdateBlog.affected === 1;
  }
  async deleteBlog(id: string): Promise<boolean> {
    const resultDeleteBlog = await this.blogsRepository
      .createQueryBuilder()
      .delete()
      .from(Blog)
      .where('id = :id', { id })
      .execute();

    return resultDeleteBlog.affected === 1;
  }
}
