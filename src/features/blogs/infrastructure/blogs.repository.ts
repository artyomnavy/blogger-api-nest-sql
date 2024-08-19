import { Injectable } from '@nestjs/common';
import { BlogModel, BlogOutputModel } from '../api/models/blog.output.model';
import { CreateAndUpdateBlogModel } from '../api/models/blog.input.model';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Blog } from '../domain/blog.entity';
import { User } from '../../users/domain/user.entity';
import { BlogBanByAdmin } from '../../bans/domain/blog-ban-by-admin.entity';
import { BlogsQueryRepository } from './blogs.query-repository';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogsRepository: Repository<Blog>,
    private readonly blogsQueryRepository: BlogsQueryRepository,
  ) {}
  async createBlog(
    newBlog: BlogModel,
    user: User,
    blogBanByAdmin: BlogBanByAdmin,
    manager?: EntityManager,
  ): Promise<BlogOutputModel> {
    const blogsRepository = manager
      ? manager.getRepository(Blog)
      : this.blogsRepository;

    const blog = new Blog();

    blog.id = newBlog.id;
    blog.name = newBlog.name;
    blog.description = newBlog.description;
    blog.websiteUrl = newBlog.websiteUrl;
    blog.createdAt = newBlog.createdAt;
    blog.isMembership = newBlog.isMembership;
    blog.user = user;
    blog.blogBanByAdmin = blogBanByAdmin;

    const resultCreateBlog = await blogsRepository.save(blog);

    return await this.blogsQueryRepository.blogMapper(resultCreateBlog);
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
  async bindBlogWithUser(
    blogId: string,
    user: User,
    blogBanByAdmin: BlogBanByAdmin,
    manager?: EntityManager,
  ): Promise<boolean> {
    const queryBuilder = manager
      ? manager.createQueryBuilder(Blog, 'b')
      : this.blogsRepository.createQueryBuilder('b');

    const resultBind = await queryBuilder
      .update(Blog)
      .set({ user: user, blogBanByAdmin: blogBanByAdmin })
      .where('id = :blogId', { blogId })
      .execute();

    return resultBind.affected === 1;
  }
}
