export class BlogSubscriptionCreatedEvent {
  constructor(
    public userId: string,
    public blogId: string,
  ) {}
}
