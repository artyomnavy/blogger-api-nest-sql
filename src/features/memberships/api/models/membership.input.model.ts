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
  MembershipPlans,
  PaymentSystems,
} from '../../../../common/utils';

export class BuyMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  membershipPlanId: string;

  @Transform(({ value }) => value?.trim())
  @IsOptional()
  @IsEnum(PaymentSystems)
  @IsNotEmpty()
  paymentSystem: PaymentSystems = PaymentSystems.STRIPE;
}

export class CreateBlogMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsEnum(MembershipPlans)
  @IsNotEmpty()
  planName: MembershipPlans;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @Transform(({ value }) => value?.trim())
  @IsEnum(Currency)
  @IsNotEmpty()
  currency: Currency;
}
