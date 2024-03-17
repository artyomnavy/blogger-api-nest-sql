import { Injectable } from '@nestjs/common';
import {
  blogMapper,
  BlogModel,
  BlogOutputModel,
} from '../api/models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class BlogsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}
  async getAllBlogs(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const searchNameTerm = queryData.searchNameTerm
      ? queryData.searchNameTerm
      : '';
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? queryData.sortDirection
      : 'desc';
    const pageNumber = queryData.pageNumber ? queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? queryData.pageSize : 10;

    const query = `SELECT
                "id", "name", "description", "websiteUrl", "createdAt", "isMembership"
                FROM public."Blogs"
                WHERE "name" ILIKE $1
                ORDER BY "${sortBy}" ${sortDirection}
                LIMIT $2 OFFSET $3`;

    const blogs = await this.dataSource.query(query, [
      `%${searchNameTerm}%`,
      +pageSize,
      (+pageNumber - 1) * +pageSize,
    ]);

    const totalCount = await this.dataSource.query(
      `SELECT
                COUNT(*) FROM public."Blogs"
                WHERE "name" ILIKE $1`,
      [`%${searchNameTerm}%`],
    );

    const pagesCount = Math.ceil(+totalCount[0].count / +pageSize);

    return {
      pagesCount: pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +totalCount[0].count,
      items: blogs.map(blogMapper),
    };
  }
  async getBlogById(id: string): Promise<BlogOutputModel | null> {
    const query = `SELECT
                "id", "name", "description", "websiteUrl", "createdAt", "isMembership"
                FROM public."Blogs"
                WHERE "id" = $1`;

    const blog = await this.dataSource.query(query, [id]);

    if (!blog.length) {
      return null;
    } else {
      return blogMapper(blog[0]);
    }
  }
}
