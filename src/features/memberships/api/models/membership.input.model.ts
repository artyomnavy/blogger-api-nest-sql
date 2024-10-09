import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class BuyMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  membershipPlanId: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  paymentSystem: 'stripe' | 'paypal' | 'tinkoff' = 'stripe';
}
