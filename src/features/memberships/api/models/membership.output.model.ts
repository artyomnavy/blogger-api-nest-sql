import { Currency, MembershipsPlans } from '../../../../common/utils';

export class MembershipPlanOutputModel {
  id: string;
  monthsCount: number;
  price: number;
  currency: Currency;
}

export class MembershipPlanForBlog {
  constructor(
    public id: string,
    public planName: MembershipsPlans,
    public monthsCount: number,
    public price: number,
    public currency: Currency,
  ) {}
}

export class BlogMembershipPlanOutputModel {
  id: string;
  planName: string;
  price: number;
  monthsCount: number;
  currency: Currency;
  blogId: string;
  blogName: string;
}
