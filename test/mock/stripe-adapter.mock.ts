import { StripeAdapter } from '../../src/features/integrations/payments/adapters/stripe-adapter';
import { PaymentBlogMembership } from '../../src/features/integrations/payments/domain/payment-blog-membership.entity';
import { Request } from 'express';
import { Stripe } from 'stripe';

export class StripeAdapterMock extends StripeAdapter {
  constructor() {
    super();
    this.stripe.webhooks.constructEvent = (...args) => {
      return this.constructEvent(...args);
    };
  }

  private constructEvent(
    rawBody: Buffer | string,
    signature: any,
    webhookSecret: string,
    tolerance?: number | undefined,
    cryptoProvider?: Stripe.CryptoProvider | undefined,
    receivedAt?: number | undefined,
  ) {
    // const eventString = rawBody.toString();
    // const eventData = JSON.parse(eventString);
    //
    // return eventData as Stripe.Event;

    const sign = signature.split('_');

    if (sign[1] === 'completed') {
      return {
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: sign[2],
          },
        },
      } as unknown as Stripe.Event;
    } else {
      return {
        type: 'checkout.session.expired',
        data: {
          object: {
            client_reference_id: sign[2],
          },
        },
      } as unknown as Stripe.Event;
    }
  }

  createPayment(paymentData: {
    payment: PaymentBlogMembership;
    req: Request;
  }): Promise<any> {
    return Promise.resolve({
      data: {
        url: `https://testpaymentstripe.com/${paymentData.payment.id}`,
      },
    });
  }
}
