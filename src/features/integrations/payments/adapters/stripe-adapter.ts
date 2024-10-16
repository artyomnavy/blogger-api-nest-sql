import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import process from 'node:process';
import { PaymentsSystems } from '../../../../common/utils';
import { BlogMembershipPlan } from '../../../memberships/domain/blog-membership-plan.entity';
import { Request } from 'express';
import { addMinutes, getUnixTime } from 'date-fns';
import { IPaymentAdapter } from '../managers/payments-manager';

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

  async createPayment(
    paymentSystem: PaymentsSystems,
    blogMembershipPlan: BlogMembershipPlan,
    paymentId: string,
    req: Request,
  ) {
    // Устанавливаем значение времени в течение которого необходимо оплатить подписку (30 минут)
    const expirationTime = addMinutes(new Date(), 30);
    const expiresAt = getUnixTime(expirationTime);

    const session = await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: blogMembershipPlan.currency,
            product_data: {
              name: blogMembershipPlan.id,
              description: blogMembershipPlan.planName,
            },
            unit_amount: blogMembershipPlan.price,
          },
          quantity: blogMembershipPlan.monthsCount,
        },
      ],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/integrations/stripe/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/integrations/stripe/cancel`,
      client_reference_id: paymentId,
      expires_at: expiresAt,
    });

    return {
      data: session,
    };
  }
}
