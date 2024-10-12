import { Injectable } from '@nestjs/common';
import { PaymentsSystems } from '../../../common/utils';
import { BlogMembershipPlan } from '../domain/blog-membership-plan.entity';
import { Request } from 'express';

interface IPaymentAdapter {
  createPayment(
    paymentSystem: PaymentsSystems,
    blogMembershipPlan: BlogMembershipPlan,
    userId: string,
    req: Request,
  ): { data: any };
}

@Injectable()
export class PaymentsManager {
  adapters: Partial<Record<PaymentsSystems, IPaymentAdapter>>;
  constructor(
    paypalAdapter: IPaymentAdapter,
    stripeAdapter: IPaymentAdapter,
    tinkoffAdapter: IPaymentAdapter,
  ) {
    this.adapters[PaymentsSystems.PAYPAL] = paypalAdapter;
    this.adapters[PaymentsSystems.STRIPE] = stripeAdapter;
    this.adapters[PaymentsSystems.TINKOFF] = tinkoffAdapter;
  }

  async createPayment(
    paymentSystem: PaymentsSystems,
    blogMembershipPlan: BlogMembershipPlan,
    userId: string,
    req: Request,
  ) {
    return this.adapters[paymentSystem].createPayment(
      paymentSystem,
      blogMembershipPlan,
      userId,
      req,
    );
  }
}
