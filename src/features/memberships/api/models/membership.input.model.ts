import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
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
  @IsOptional()
  @IsEnum(PaymentsSystems)
  @IsNotEmpty()
  paymentSystem: PaymentsSystems = PaymentsSystems.STRIPE;
}

export class CreateBlogMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsEnum(MembershipsPlans)
  @IsNotEmpty()
  planName: MembershipsPlans;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Transform(({ value }) => value?.trim())
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;
}
