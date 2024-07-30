import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogBanByAdmin } from '../domain/blog-ban-by-admin.entity';
import { BlogBanInfoByAdmin } from '../api/models/blog.output.model';

@Injectable()
export class BlogsBansByAdminRepository {
  constructor(
    @InjectRepository(BlogBanByAdmin)
    private readonly blogsBansByAdminRepository: Repository<BlogBanByAdmin>,
  ) {}
  async createBlogBanInfoByAdmin(
    blogBanInfoByAdmin: BlogBanInfoByAdmin,
    manager: EntityManager,
  ): Promise<BlogBanByAdmin> {
    const blogBanByAdmin = new BlogBanByAdmin();

    blogBanByAdmin.id = blogBanInfoByAdmin.id;
    blogBanByAdmin.isBanned = blogBanInfoByAdmin.isBanned;
    blogBanByAdmin.banDate = blogBanInfoByAdmin.banDate;

    return await manager.save(blogBanByAdmin);
  }
  async updateBlogBanInfoByAdmin(
    blogBanByAdmin: BlogBanByAdmin,
    isBanned: boolean,
    banDate: Date | null,
    manager: EntityManager,
  ): Promise<boolean> {
    blogBanByAdmin.isBanned = isBanned;
    blogBanByAdmin.banDate = banDate;

    const resultUpdateBlogBanInfoByAdmin = await manager.save(blogBanByAdmin);

    return !!resultUpdateBlogBanInfoByAdmin;
  }
}
