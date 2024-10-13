import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';

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
      .leftJoin('pbm.blogSubscription', 'blogSubscription')
      .addSelect('blogSubscription.id')
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
}
