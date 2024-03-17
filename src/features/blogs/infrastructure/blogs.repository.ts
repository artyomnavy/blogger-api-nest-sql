import { Injectable } from '@nestjs/common';
import {
  blogMapper,
  BlogModel,
  BlogOutputModel,
} from '../api/models/blog.output.model';
import { CreateAndUpdateBlogModel } from '../api/models/blog.input.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async createBlog(newBlog: BlogModel): Promise<BlogOutputModel> {
    const query = `INSERT INTO public."Blogs"(
            "id", "name", "description", "websiteUrl", "createdAt", "isMembership")
            VALUES ($1, $2, $3, $4, $5, $6)`;

    await this.dataSource.query(query, [
      newBlog.id,
      newBlog.name,
      newBlog.description,
      newBlog.websiteUrl,
      newBlog.createdAt,
      newBlog.isMembership,
    ]);

    return blogMapper(newBlog);
  }
  async updateBlog(
    id: string,
    updateData: CreateAndUpdateBlogModel,
  ): Promise<boolean> {
    const query = `UPDATE public."Blogs"
            SET "name"=$1, "description"=$2, "websiteUrl"=$3
            WHERE "id" = $4`;

    const resultUpdateBlog = await this.dataSource.query(query, [
      updateData.name,
      updateData.description,
      updateData.websiteUrl,
      id,
    ]);

    return resultUpdateBlog[1] === 1;
  }
  async deleteBlog(id: string): Promise<boolean> {
    const query = `DELETE FROM public."Blogs"
             WHERE "id" = $1`;

    const resultDeleteBlog = await this.dataSource.query(query, [id]);

    return resultDeleteBlog[1] === 1;
  }
}
