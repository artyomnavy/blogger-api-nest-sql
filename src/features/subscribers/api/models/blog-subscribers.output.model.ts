import { SubscriptionStatus } from '../../../../common/utils';

export class Subscriber {
  constructor(
    public id: string,
    public telegramCode: string | null,
    public telegramId: string | null,
    public status: SubscriptionStatus,
  ) {}
}
