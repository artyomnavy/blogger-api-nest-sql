export class PaginatorModel {
  searchNameTerm?: string;

  searchLoginTerm?: string;

  searchEmailTerm?: string;

  pageNumber?: number;

  pageSize?: number;

  sortBy?: string;

  sortDirection?: 'asc' | 'desc';
}
