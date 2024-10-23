import { BanStatuses, PublishedStatuses } from '../utils';

export class PaginatorModel {
  banStatus?: BanStatuses;

  bodySearchTerm?: string;

  publishedStatus?: PublishedStatuses;

  searchNameTerm?: string;

  searchLoginTerm?: string;

  searchEmailTerm?: string;

  pageNumber?: number;

  pageSize?: number;

  sortBy?: string;

  sort?: string | string[];

  sortDirection?: 'ASC' | 'DESC';
}
