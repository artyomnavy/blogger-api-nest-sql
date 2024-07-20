import { ResultCode } from '../utils';

export type ResultType<T> = {
  data: T;
  code: ResultCode;
  message?: string;
  field?: string;
};
