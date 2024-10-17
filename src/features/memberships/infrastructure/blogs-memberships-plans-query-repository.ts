import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogMembershipPlan } from '../domain/blog-membership-plan.entity';
import { MembershipPlanOutputModel } from '../api/models/membership.output.model';
import { MembershipsPlans } from '../../../common/utils';

@Injectable()
export class BlogsMembershipsPlansQueryRepository {
  constructor(
    @InjectRepository(BlogMembershipPlan)
    private readonly blogsMembershipsPlansQueryRepository: Repository<BlogMembershipPlan>,
  ) {}
  async getBlogMembershipPlanById(
    membershipPlanId: string,
    manager?: EntityManager,
  ): Promise<BlogMembershipPlan | null> {
    const blogsMembershipsPlansQueryRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansQueryRepository;

    const blogMembershipPlan = await blogsMembershipsPlansQueryRepository
      .createQueryBuilder('bmp')
      .leftJoinAndSelect('bmp.blog', 'b')
      .where('bmp.id = :membershipPlanId', {
        membershipPlanId: membershipPlanId,
      })
      .getOne();

    if (!blogMembershipPlan) {
      return null;
    } else {
      return blogMembershipPlan;
    }
  }
  async checkMembershipsPlansForBlog(
    blogId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const blogsMembershipsPlansQueryRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansQueryRepository;

    const blogMembershipsPlans = await blogsMembershipsPlansQueryRepository
      .createQueryBuilder('bmp')
      .where('bmp.blog_id = :blogId', {
        blogId: blogId,
      })
      .getMany();

    return blogMembershipsPlans.length !== 0;
  }
  async getMembershipsPlansForBlog(
    blogId: string,
    manager?: EntityManager,
  ): Promise<MembershipPlanOutputModel[]> {
    const blogsMembershipsPlansQueryRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansQueryRepository;

    const membershipsPlans = await blogsMembershipsPlansQueryRepository
      .createQueryBuilder('bmp')
      .leftJoin('bmp.blog', 'b')
      .where('b.id = :blogId', {
        blogId: blogId,
      })
      .getMany();

    return membershipsPlans.length < 1
      ? membershipsPlans
      : membershipsPlans.map((plan) => {
          return {
            id: plan.id,
            monthsCount: plan.monthsCount,
            price: plan.price,
            currency: plan.currency,
          };
        });
  }
  async getMembershipPlanByNameForBlog(
    blogId: string,
    planName: MembershipsPlans,
    manager?: EntityManager,
  ): Promise<BlogMembershipPlan | null> {
    const blogsMembershipsPlansQueryRepository = manager
      ? manager.getRepository(BlogMembershipPlan)
      : this.blogsMembershipsPlansQueryRepository;

    const blogMembershipPlan = await blogsMembershipsPlansQueryRepository
      .createQueryBuilder('bmp')
      .leftJoinAndSelect('bmp.blog', 'b')
      .where('bmp.planName = :planName', {
        planName: planName,
      })
      .andWhere('b.id = :blogId', { blogId: blogId })
      .getOne();

    if (!blogMembershipPlan) {
      return null;
    } else {
      return blogMembershipPlan;
    }
  }
}
