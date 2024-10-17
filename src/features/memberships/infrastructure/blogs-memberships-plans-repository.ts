import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogMembershipPlan } from '../domain/blog-membership-plan.entity';
import {
  BlogMembershipPlanOutputModel,
  MembershipPlanForBlog,
} from '../api/models/membership.output.model';
import { Blog } from '../../blogs/domain/blog.entity';

@Injectable()
export class BlogsMembershipsPlansRepository {
  constructor(
    @InjectRepository(BlogMembershipPlan)
    private readonly blogsMembershipsPlansRepository: Repository<BlogMembershipPlan>,
  ) {}
  async createMembershipPlanForBlog(
    membershipPlan: MembershipPlanForBlog,
    blog: Blog,
    manager?: EntityManager,
  ): Promise<BlogMembershipPlanOutputModel> {
    const blogsMembershipsPlansRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansRepository;

    const blogMembershipPlan = new BlogMembershipPlan();

    blogMembershipPlan.id = membershipPlan.id;
    blogMembershipPlan.planName = membershipPlan.planName;
    blogMembershipPlan.price = membershipPlan.price;
    blogMembershipPlan.currency = membershipPlan.currency;
    blogMembershipPlan.monthsCount = membershipPlan.monthsCount;
    blogMembershipPlan.blog = blog;

    const resultCreateBlogMembershipPlan =
      await blogsMembershipsPlansRepository.save(blogMembershipPlan);

    return {
      id: resultCreateBlogMembershipPlan.id,
      planName: resultCreateBlogMembershipPlan.planName,
      price: resultCreateBlogMembershipPlan.price,
      monthsCount: resultCreateBlogMembershipPlan.monthsCount,
      currency: resultCreateBlogMembershipPlan.currency,
      blogId: resultCreateBlogMembershipPlan.blog.id,
      blogName: resultCreateBlogMembershipPlan.blog.name,
    };
  }
  async deleteMembershipPlanForBlog(
    id: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsMembershipsPlansRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansRepository;

    const resultDeleteBlogMembershipPlan = await blogsMembershipsPlansRepository
      .createQueryBuilder()
      .delete()
      .from(BlogMembershipPlan)
      .where('id = :id', { id: id })
      .execute();

    return resultDeleteBlogMembershipPlan.affected === 1;
  }
}
