import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';
import { PaginatorBaseModel } from '../../../../common/models/paginator.input.model';
import { PaginatorOutputModel } from '../../../../common/models/paginator.output.model';
import { PaymentBlogMembershipOutputModel } from '../api/models/payment-blog-membership.output.model';
import { PaymentStatuses } from '../../../../common/utils';

@Injectable()
export class PaymentsBlogsMembershipsQueryRepository {
  constructor(
    @InjectRepository(PaymentBlogMembership)
    private readonly paymentsBlogsMembershipsQueryRepository: Repository<PaymentBlogMembership>,
  ) {}
  async getPaymentBlogMembershipById(
    paymentId: string,
    manager?: EntityManager,
  ): Promise<PaymentBlogMembership | null> {
    const paymentBlogMembershipRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsQueryRepository;

    const payment = await paymentBlogMembershipRepository
      .createQueryBuilder('pbm')
      .leftJoin('pbm.blogSubscription', 'bs')
      .addSelect('bs.id')
      .where('pbm.id = :paymentId', {
        paymentId: paymentId,
      })
      .getOne();

    if (!payment) {
      return null;
    } else {
      return payment;
    }
  }
  async getAllPaymentsMembershipsForBlog(
    blogId: string,
    queryData: PaginatorBaseModel,
  ): Promise<PaginatorOutputModel<PaymentBlogMembershipOutputModel>> {
    const sortBy = queryData.sortBy ? queryData.sortBy : 'createdAt';
    const sortDirection = queryData.sortDirection
      ? (queryData.sortDirection.toUpperCase() as 'ASC' | 'DESC')
      : 'DESC';
    const pageNumber = queryData.pageNumber ? +queryData.pageNumber : 1;
    const pageSize = queryData.pageSize ? +queryData.pageSize : 10;

    const payments = await this.paymentsBlogsMembershipsQueryRepository
      .createQueryBuilder('pbm')
      .leftJoinAndSelect('pbm.blogSubscription', 'bs')
      .leftJoinAndSelect('bs.user', 'u')
      .leftJoinAndSelect('bs.blog', 'b')
      .leftJoinAndSelect('pbm.blogMembershipPlan', 'bmp')
      .where('pbm.status = :status', { status: PaymentStatuses.CONFIRMED })
      .andWhere('b.id = :blogId', { blogId })
      .orderBy(`pbm.${sortBy}`, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const totalCount: number =
      await this.paymentsBlogsMembershipsQueryRepository
        .createQueryBuilder('pbm')
        .leftJoinAndSelect('pbm.blogSubscription', 'bs')
        .leftJoinAndSelect('bs.user', 'u')
        .leftJoinAndSelect('bs.blog', 'b')
        .leftJoinAndSelect('pbm.blogMembershipPlan', 'bmp')
        .where('pbm.status = :status', { status: PaymentStatuses.CONFIRMED })
        .andWhere('b.id = :blogId', { blogId })
        .getCount();

    const pagesCount = Math.ceil(totalCount / pageSize);

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: totalCount,
      items: payments.map(
        (payment: PaymentBlogMembership): PaymentBlogMembershipOutputModel => ({
          userId: payment.blogSubscription.user.id,
          userLogin: payment.blogSubscription.user.login,
          blogId: payment.blogSubscription.blog.id,
          blogTitle: payment.blogSubscription.blog.name,
          membershipPlan: {
            id: payment.blogMembershipPlan.id,
            monthsCount: payment.blogMembershipPlan.monthsCount,
            price: payment.blogMembershipPlan.price,
            currency: payment.blogMembershipPlan.currency,
          },
        }),
      ),
    };
  }
}
