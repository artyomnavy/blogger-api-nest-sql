import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception-filter';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'node:path';

export const appSettings = (app: INestApplication) => {
  // Подключаем раздачу статических файлов из директории src/views по URL,
  // начинающимся с /views (позволяет загружать файлы через http)
  app.use('/views', express.static(join(__dirname, '..', 'src', 'views')));
  app.enableCors();
  app.use(cookieParser());
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const errorsForResponse: { message: string; field: string }[] = [];

        errors.forEach((e) => {
          const constraintKeys = Object.keys(e.constraints);
          constraintKeys.forEach((cKey) => {
            errorsForResponse.push({
              message: e.constraints[cKey],
              field: e.property,
            });
          });
        });
        throw new BadRequestException(errorsForResponse);
      },
    } as object),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
};
