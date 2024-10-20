import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import process from 'node:process';
import { Request } from 'express';
import { addMinutes, getUnixTime } from 'date-fns';
import { IPaymentAdapter } from '../managers/payments-manager';
import { PaymentBlogMembership } from '../domain/payment-blog-membership.entity';

@Injectable()
export class StripeAdapter implements IPaymentAdapter {
  stripe: Stripe;
  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error('Stripe secret key is missing to env file');
    }

    this.stripe = new Stripe(secretKey);
  }

  async createPayment(paymentData: {
    payment: PaymentBlogMembership;
    req: Request;
  }) {
    // Устанавливаем значение времени в течение которого необходимо оплатить подписку (30 минут)
    const expirationTime = addMinutes(new Date(), 30);
    const expiresAt = getUnixTime(expirationTime);

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: paymentData.payment.blogMembershipPlan.currency,
            product_data: {
              name: paymentData.payment.blogMembershipPlan.id,
              description: paymentData.payment.blogMembershipPlan.planName,
            },
            unit_amount: paymentData.payment.blogMembershipPlan.price,
          },
          quantity: paymentData.payment.blogMembershipPlan.monthsCount,
        },
      ],
      mode: 'payment',
      success_url: `${paymentData.req.protocol}://${paymentData.req.get('host')}/integrations/stripe/success`,
      cancel_url: `${paymentData.req.protocol}://${paymentData.req.get('host')}/integrations/stripe/cancel`,
      client_reference_id: paymentData.payment.id,
      expires_at: expiresAt,
    });

    return {
      data: session,
    };
  }
}
