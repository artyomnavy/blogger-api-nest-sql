import { HTTP_STATUSES, ResultCode } from '../utils';
import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';

export const resultCodeToHttpException = (
  code: ResultCode,
  message?: string,
  field?: string,
) => {
  switch (code) {
    case ResultCode.FORBIDDEN:
      throw new ForbiddenException(message);
    case ResultCode.NOT_FOUND:
      throw new NotFoundException(message);
    case ResultCode.BAD_REQUEST:
      throw new BadRequestException({ message: message, field: field });
    case ResultCode.IM_A_TEAPOT:
      throw new HttpException(
        message ? message : 'Something error',
        HTTP_STATUSES.IM_A_TEAPOT_418,
      );
  }
};
