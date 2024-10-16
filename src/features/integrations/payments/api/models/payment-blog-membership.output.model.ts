import { Currency } from '../../../../../common/utils';

export class MembershipPlanOutputModel {
  id: string;
  monthsCount: number;
  price: number;
  currency: Currency;
}

export class PaymentBlogMembershipOutputModel {
  userId: string;
  userLogin: string;
  blogId: string;
  blogTitle: string;
  membershipPlan: MembershipPlanOutputModel;
}
