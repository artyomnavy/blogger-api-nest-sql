import { Injectable } from '@nestjs/common';
import { PaymentsSystems } from '../../../../common/utils';
import { Request } from 'express';
import { StripeAdapter } from '../adapters/stripe-adapter';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';

export interface IPaymentAdapter {
  createPayment(paymentData: {
    payment: PaymentBlogMembership;
    req: Request;
  }): Promise<{ data: any }>;
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

  async createPayment(paymentData: {
    payment: PaymentBlogMembership;
    req: Request;
  }) {
    if (!this.adapters[paymentData.payment.paymentSystem]) {
      throw new Error('Payment system is missing');
    }

    return this.adapters[paymentData.payment.paymentSystem].createPayment(
      paymentData,
    );
  }
}
