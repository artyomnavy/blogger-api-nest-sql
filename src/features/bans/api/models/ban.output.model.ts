export class UserBanInfoByAdmin {
  constructor(
    public id: string,
    public isBanned: boolean,
    public banDate: Date | null,
    public banReason: string | null,
  ) {}
}

export class UserBanInfoByBlogger {
  constructor(
    public id: string,
    public isBanned: boolean,
    public banDate: Date | null,
    public banReason: string | null,
    public blogId: string | null,
  ) {}
}

export class BlogBanInfoByAdmin {
  constructor(
    public id: string,
    public isBanned: boolean,
    public banDate: Date | null,
  ) {}
}
