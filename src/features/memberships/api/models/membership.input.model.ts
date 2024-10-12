import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaymentsSystems } from '../../../../common/utils';

export class BuyMembershipPlanModel {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  membershipPlanId: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  paymentSystem: PaymentsSystems = PaymentsSystems.STRIPE;
}
