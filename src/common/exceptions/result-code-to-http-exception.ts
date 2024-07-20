import { ResultCode } from '../utils';
import {
  BadRequestException,
  ForbiddenException,
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
  }
};
