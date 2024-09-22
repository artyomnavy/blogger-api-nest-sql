export class PostCreatedEvent {
  constructor(
    public blogId: string,
    public blogName: string,
  ) {}
}
