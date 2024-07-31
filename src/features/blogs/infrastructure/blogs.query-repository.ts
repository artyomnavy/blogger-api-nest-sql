import { Injectable } from '@nestjs/common';
import {
  BlogOutputModel,
  BlogWithOwnerAndBanInfoModel,
  BlogWithOwnerAndBanInfoOutputModel,
} from '../api/models/blog.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Blog } from '../domain/blog.entity';

@Injectable()
export class BlogsQueryRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogsQueryRepository: Repository<Blog>,
  ) {}
  async getAllBlogs(
    queryData: PaginatorModel,
    userId?: string,
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
      .leftJoin('b.blogBanByAdmin', 'bba')
      .leftJoin('b.user', 'u')
      .where('(b.name ILIKE :name)', { name: `%${searchNameTerm}%` })
      .andWhere(userId ? '(u.id = :userId)' : '(TRUE)', { userId })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .orderBy(`b.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.blogsQueryRepository
      .createQueryBuilder('b')
      .select('COUNT(b.id)')
      .leftJoin('b.user', 'u')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .where('(b.name ILIKE :name)', { name: `%${searchNameTerm}%` })
      .andWhere(userId ? '(u.id = :userId)' : '(TRUE)', { userId })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(blogs.map((blog) => this.blogMapper(blog))),
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
      .leftJoin('b.blogBanByAdmin', 'bba')
      .where('b.id = :id', { id })
      .andWhere('(bba.isBanned = :ban)', { ban: false })
      .getOne();

    if (!blog) {
      return null;
    } else {
      return await this.blogMapper(blog);
    }
  }
  async checkOwnerBlog(
    userId: string,
    blogId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const queryBuilder = manager
      ? manager.createQueryBuilder(Blog, 'b')
      : this.blogsQueryRepository.createQueryBuilder('b');

    const blog = await queryBuilder
      .select(['b.id AS "blogId"', 'u.id AS "userId"'])
      .leftJoin('b.user', 'u')
      .where('b.id = :blogId', { blogId })
      .andWhere('u.id = :userId', { userId })
      .getRawOne();

    return blog != null;
  }
  async getAllBlogsWithOwnerAndBanInfoForAdmin(
    queryData: PaginatorModel,
  ): Promise<PaginatorOutputModel<BlogWithOwnerAndBanInfoOutputModel>> {
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
        'b.id AS id',
        'b.name AS name',
        'b.description AS description',
        'b.websiteUrl AS "websiteUrl"',
        'b.createdAt AS "createdAt"',
        'b.isMembership AS "isMembership"',
        'u.id AS "userId"',
        'u.login AS "userLogin"',
        'bba.isBanned AS "isBanned"',
        'bba.banDate AS "banDate"',
      ])
      .leftJoin('b.user', 'u')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .where('b.name ILIKE :name', { name: `%${searchNameTerm}%` })
      .orderBy(`b.${sortBy}`, sortDirection)
      .offset((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .getRawMany();

    const totalCount: number = await this.blogsQueryRepository
      .createQueryBuilder('b')
      .leftJoin('b.user', 'u')
      .leftJoin('b.blogBanByAdmin', 'bba')
      .select('COUNT(b.id)')
      .where('b.name ILIKE :name', { name: `%${searchNameTerm}%` })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        blogs.map((blog) => this.blogWithOwnerAndBanInfoForAdminMapper(blog)),
      ),
    };
  }
  async getOrmBlogByIdWithBanInfo(
    blogId: string,
    manager?: EntityManager,
  ): Promise<Blog | null> {
    const blogsQueryRepository = manager
      ? manager.getRepository(Blog)
      : this.blogsQueryRepository;

    const blog = await blogsQueryRepository.findOne({
      where: { id: blogId },
      relations: ['blogBanByAdmin'],
    });

    if (!blog) {
      return null;
    } else {
      return blog;
    }
  }
  async blogMapper(blog: Blog): Promise<BlogOutputModel> {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }
  async blogWithOwnerAndBanInfoForAdminMapper(
    blog: BlogWithOwnerAndBanInfoModel,
  ): Promise<BlogWithOwnerAndBanInfoOutputModel> {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
      blogOwnerInfo: {
        userId: blog.userId,
        userLogin: blog.userLogin,
      },
      banInfo: {
        isBanned: blog.isBanned,
        banDate: blog.banDate ? blog.banDate.toISOString() : null,
      },
    };
  }
}
