import { PublishedStatuses } from '../utils';

export class PaginatorModel {
  bodySearchTerm?: string;

  publishedStatus?: PublishedStatuses;

  searchNameTerm?: string;

  searchLoginTerm?: string;

  searchEmailTerm?: string;

  pageNumber?: number;

  pageSize?: number;

  sortBy?: string;

  sortDirection?: 'ASC' | 'DESC';
}
