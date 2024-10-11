import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BlogMembershipPlan } from '../domain/blog-membership-plan.entity';

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
}
