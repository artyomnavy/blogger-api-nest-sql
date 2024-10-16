import { Injectable } from '@nestjs/common';
import { PaymentsSystems } from '../../../../common/utils';
import { BlogMembershipPlan } from '../../../memberships/domain/blog-membership-plan.entity';
import { Request } from 'express';
import { StripeAdapter } from '../adapters/stripe-adapter';

export interface IPaymentAdapter {
  createPayment(
    paymentSystem: PaymentsSystems,
    blogMembershipPlan: BlogMembershipPlan,
    paymentId: string,
    req: Request,
  ): Promise<{ data: any }>;
}

@Injectable()
export class PaymentsManager {
  adapters: Partial<Record<PaymentsSystems, IPaymentAdapter>> = {};
  constructor(
    stripeAdapter: StripeAdapter,
    // paypalAdapter: PaypalAdapter,
    // tinkoffAdapter: TinkoffAdapter,
  ) {
    this.adapters[PaymentsSystems.STRIPE] = stripeAdapter;
    // this.adapters[PaymentsSystems.PAYPAL] = paypalAdapter;
    // this.adapters[PaymentsSystems.TINKOFF] = tinkoffAdapter;
  }

  async createPayment(
    paymentSystem: PaymentsSystems,
    blogMembershipPlan: BlogMembershipPlan,
    paymentId: string,
    req: Request,
  ) {
    if (!this.adapters[paymentSystem]) {
      throw new Error('Payment system is missing');
    }

    return this.adapters[paymentSystem].createPayment(
      paymentSystem,
      blogMembershipPlan,
      paymentId,
      req,
    );
  }
}
