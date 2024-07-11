import { Injectable } from '@nestjs/common';
import { blogMapper, BlogOutputModel } from '../api/models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../domain/blog.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogsQueryRepository: Repository<Blog>,
  ) {}
  async getAllBlogs(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogOutputModel>> {
    const searchNameTerm = queryData.searchNameTerm
      ? queryData.searchNameTerm
      : '';
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;

    const blogs = await this.blogsQueryRepository
      .createQueryBuilder('b')
      .select([
        'b.id',
        'b.name',
        'b.description',
        'b.websiteUrl',
        'b.createdAt',
        'b.isMembership',
      ])
      .where('b.name ILIKE :name', { name: `%${searchNameTerm}%` })
      .orderBy(`b.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.blogsQueryRepository
      .createQueryBuilder('b')
      .select('COUNT(b.id)')
      .where('b.name ILIKE :name', { name: `%${searchNameTerm}%` })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: blogs.map(blogMapper),
    };
  }
  async getBlogById(id: string): Promise<BlogOutputModel | null> {
    const blog = await this.blogsQueryRepository
      .createQueryBuilder()
      .select([
        'b.id',
        'b.name',
        'b.description',
        'b.websiteUrl',
        'b.createdAt',
        'b.isMembership',
      ])
      .from(Blog, 'b')
      .where('b.id = :id', { id })
      .getOne();

    if (!blog) {
      return null;
    } else {
      return blogMapper(blog);
    }
  }
  async checkBindBlog(userId: string): Promise<Blog | null> {
    const blog = await this.blogsQueryRepository
      .createQueryBuilder('b')
      .select(['b.id AS "blogId"', 'u.id AS "userId"'])
      .leftJoin('b.user', 'u')
      .where('u.id = :userId', { userId })
      .getRawOne();

    return blog;
  }
}
