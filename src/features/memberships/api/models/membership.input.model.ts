import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  Currency,
  MembershipsPlans,
  PaymentsSystems,
} from '../../../../common/utils';

export class BuyMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  membershipPlanId: string;

  @Transform(({ value }) => value?.trim())
  @IsEnum(PaymentsSystems)
  @IsNotEmpty()
  paymentSystem: PaymentsSystems = PaymentsSystems.STRIPE;
}

export class CreateBlogMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsEnum(MembershipsPlans)
  @IsNotEmpty()
  planName: MembershipsPlans;

  @Transform(({ value }) => value?.trim())
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Transform(({ value }) => value?.trim())
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;
}
