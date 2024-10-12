import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';
import { PaymentsStatuses, PaymentsSystems } from '../../../common/utils';
import { BlogSubscription } from '../../subscriptions/domain/blog-subscription.entity';

@Injectable()
export class PaymentsBlogsMembershipsRepository {
  constructor(
    @InjectRepository(PaymentBlogMembership)
    private readonly paymentsBlogsMembershipsRepository: Repository<PaymentBlogMembership>,
  ) {}
  async createPayment(
    paymentSystem: PaymentsSystems,
    price: number,
    manager?: EntityManager,
  ): Promise<PaymentBlogMembership> {
    const paymentBlogMembershipRepository = manager
      ? manager.getRepository(PaymentBlogMembership)
      : this.paymentsBlogsMembershipsRepository;

    const paymentBlogMembership = new PaymentBlogMembership();

    paymentBlogMembership.paymentSystem = paymentSystem;
    paymentBlogMembership.price = price;
    paymentBlogMembership.status = PaymentsStatuses.PENDING;

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
}
