import { BanStatuses, PublishedStatuses } from '../utils';

export class PaginatorBaseModel {
  pageNumber: number;

  pageSize: number;

  sortBy: string;

  sortDirection: 'ASC' | 'DESC';
}

export class PaginatorBlogModel extends PaginatorBaseModel {
  searchNameTerm: string;
}

export class PaginatorUserModel extends PaginatorBaseModel {
  banStatus: BanStatuses;

  searchLoginTerm: string;

  searchEmailTerm: string;
}

export class PaginatorBannedUserModel extends PaginatorBaseModel {
  searchLoginTerm: string;
}

export class PaginatorQuestionModel extends PaginatorBaseModel {
  bodySearchTerm: string;

  publishedStatus: PublishedStatuses;
}

export class PaginatorTopQuizModel {
  sort: string | string[];

  pageNumber: number;

  pageSize: number;
}
