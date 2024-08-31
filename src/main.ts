import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSettings } from './app.settings';
import { join } from 'node:path';
import * as express from 'express';

const port = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Подключаем раздачу статических файлов из директории src/views по URL,
  // начинающимся с /views (позволяет загружать файлы через http)
  app.use('/views', express.static(join(__dirname, '..', 'src', 'views')));

  appSettings(app);

  await app.listen(port, () => {
    console.log(`App starting listen port: ${port}`);
  });
}
bootstrap();
