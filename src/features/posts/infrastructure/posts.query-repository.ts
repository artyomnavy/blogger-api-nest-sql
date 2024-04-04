import { Injectable } from '@nestjs/common';
import { PostOutputModel } from '../api/models/post.output.model';
import { PaginatorModel } from '../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../common/models/paginator.output.model';
import { likesStatuses } from '../../../utils';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../domain/post.entity';

@Injectable()
export class PostsQueryRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postsQueryRepository: Repository<Post>,
  ) {}
  async getAllPosts(queryData: {
    query: PaginatorModel;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? +queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? +queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? (queryData.query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';

    const userId = queryData.userId;

    const order = sortBy === 'blogName' ? `b.name` : `p.${sortBy}`;

    const posts = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .select([
        'p.id',
        'p.title',
        'p.shortDescription',
        'p.content',
        'p.blogId',
        'p.createdAt',
        'b.name',
      ])
      .orderBy(order, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.postsQueryRepository
      .createQueryBuilder('p')
      .select('COUNT(p.id)')
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        posts.map((post: Post) => this.postMapper(post)),
      ),
    };
  }
  async getPostById(
    id: string,
    userId?: string,
  ): Promise<PostOutputModel | null> {
    const post = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .select([
        'p.id',
        'p.title',
        'p.shortDescription',
        'p.content',
        'p.blogId',
        'p.createdAt',
        'b.name',
      ])
      .where('p.id = :id', { id })
      .getOne();

    if (!post) {
      return null;
    } else {
      return await this.postMapper(post);
    }
  }
  async getPostsByBlogId(queryData: {
    query: PaginatorModel;
    blogId: string;
    userId?: string;
  }): Promise<PaginatorOutputModel<PostOutputModel>> {
    const pageNumber = queryData.query.pageNumber
      ? +queryData.query.pageNumber
      : 1;
    const pageSize = queryData.query.pageSize ? +queryData.query.pageSize : 10;
    const sortBy = queryData.query.sortBy
      ? queryData.query.sortBy
      : 'createdAt';
    const sortDirection = queryData.query.sortDirection
      ? (queryData.query.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const blogId = queryData.blogId;
    const userId = queryData.userId;

    const order = sortBy === 'blogName' ? `b.name` : `p.${sortBy}`;

    const posts = await this.postsQueryRepository
      .createQueryBuilder('p')
      .leftJoin('p.blog', 'b')
      .select([
        'p.id',
        'p.title',
        'p.shortDescription',
        'p.content',
        'p.blogId',
        'p.createdAt',
        'b.name',
      ])
      .where('p.blogId = :blogId', { blogId: blogId })
      .orderBy(order, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number = await this.postsQueryRepository
      .createQueryBuilder('p')
      .select('COUNT(p.id)')
      .where('p.blogId = :blogId', {
        blogId: blogId,
      })
      .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: await Promise.all(
        posts.map((post: Post) => this.postMapper(post)),
      ),
    };
  }
  async postMapper(post: Post): Promise<PostOutputModel> {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blog.name,
      createdAt: post.createdAt.toISOString(),
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: likesStatuses.none,
        newestLikes: [],
      },
    };
  }
}
