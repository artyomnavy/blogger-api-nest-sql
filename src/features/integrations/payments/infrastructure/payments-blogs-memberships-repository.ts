import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';
import { PaymentStatuses, PaymentSystems } from '../../../../common/utils';
import { BlogMembershipPlan } from '../../../memberships/domain/blog-membership-plan.entity';

@Injectable()
export class PaymentsBlogsMembershipsRepository {
  constructor(
    @InjectRepository(PaymentBlogMembership)
    private readonly paymentsBlogsMembershipsRepository: Repository<PaymentBlogMembership>,
  ) {}
  async createPayment(
    paymentSystem: PaymentSystems,
    status: PaymentStatuses,
    price: number,
    blogMembershipPlan: BlogMembershipPlan,
    manager?: EntityManager,
  ): Promise<PaymentBlogMembership> {
    const paymentBlogMembershipRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    const paymentBlogMembership = new PaymentBlogMembership();

    paymentBlogMembership.paymentSystem = paymentSystem;
    paymentBlogMembership.price = price;
    paymentBlogMembership.blogMembershipPlan = blogMembershipPlan;
    paymentBlogMembership.status = status;

    return await paymentBlogMembershipRepository.save(paymentBlogMembership);
  }
  async addProviderInfoToPaymentBlogMembership(
    payment: PaymentBlogMembership,
    paymentProviderInfo: any,
    manager?: EntityManager,
  ): Promise<PaymentBlogMembership> {
    const paymentsBlogsMembershipsRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    payment.anyPaymentProviderInfo = paymentProviderInfo;

    return paymentsBlogsMembershipsRepository.save(payment);
  }
  async confirmPaymentBlogMembership(
    payment: PaymentBlogMembership,
    status: PaymentStatuses,
    anyConfirmPaymentSystemData: any,
    manager?: EntityManager,
  ): Promise<PaymentBlogMembership> {
    const paymentsBlogsMembershipsRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    payment.status = status;
    payment.anyConfirmPaymentSystemData = anyConfirmPaymentSystemData;

    return paymentsBlogsMembershipsRepository.save(payment);
  }
  async deletePaymentBlogMembershipById(
    paymentId: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    const paymentsBlogsMembershipsRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    const resultDeletePaymentBlogMembership =
      await paymentsBlogsMembershipsRepository.delete(paymentId);

    return resultDeletePaymentBlogMembership.affected === 1;
  }
  async updateStatusToPaymentBlogMembership(
    paymentId: string,
    status: PaymentStatuses,
    manager?: EntityManager,
  ): Promise<boolean> {
    const paymentsBlogsMembershipsRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    const resultUpdatePaymentBlogMembership =
      await paymentsBlogsMembershipsRepository
        .createQueryBuilder()
        .update(PaymentBlogMembership)
        .set({
          status: status,
        })
        .where('id = :paymentId', { paymentId: paymentId })
        .execute();

    return resultUpdatePaymentBlogMembership.affected === 1;
  }
}
