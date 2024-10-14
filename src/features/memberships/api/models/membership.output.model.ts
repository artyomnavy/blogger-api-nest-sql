import { Currency } from '../../../../common/utils';

export class MembershipPlanOutputModel {
  id: string;
  monthsCount: number;
  price: number;
  currency: Currency;
}
