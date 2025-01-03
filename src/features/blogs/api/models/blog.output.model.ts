import { BlogImagesOutputModel } from '../../../files/images/api/models/blog-image.output.model';
import { SubscriptionStatuses } from '../../../../common/utils';

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
  images: BlogImagesOutputModel;
  currentUserSubscriptionStatus: SubscriptionStatuses;
  subscribersCount: number;
}

export class BlogMapperModel {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date;
  isMembership: boolean;
  blogWallpaper: {
    url: string;
    width: string;
    height: string;
    fileSize: string;
  };
  mainImage: {
    url: string;
    width: string;
    height: string;
    fileSize: string;
  }[];
  subscribersCount: number;
  currentUserSubscriptionStatus: SubscriptionStatuses;
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
