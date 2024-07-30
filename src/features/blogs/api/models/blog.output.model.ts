export class Blog {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public websiteUrl: string,
    public createdAt: Date,
    public isMembership: boolean,
  ) {}
}

export class BlogModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
  userId?: string;
  userLogin?: string;
}
export class BlogOutputModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

export class BlogWithOwnerAndBanInfoOutputModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  blogOwnerInfo: {
    userId: string;
    userLogin: string;
  };
  banInfo: {
    isBanned: boolean;
    banDate: string | null;
  };
}

export class BlogWithOwnerAndBanInfoModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
  userId: string;
  userLogin: string;
  isBanned: boolean;
  banDate: Date | null;
}

export class BlogBanInfoByAdmin {
  constructor(
    public id: string,
    public isBanned: boolean,
    public banDate: Date | null,
  ) {}
}
