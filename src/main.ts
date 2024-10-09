import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSettings } from './app.settings';
import * as ngrok from 'ngrok';
import { Paths } from '../test/utils/test-constants';
import { TelegramAdapter } from './features/integrations/telegram/adapters/telegram.adapter';

const port = Number(process.env.PORT) || 5000;

let baseUrl = process.env.CURRENT_APP_BASE_URL || `https://localhost:${port}`;

async function connectToNgrok() {
  const url = await ngrok.connect(port);
  console.log(`Ngrok url: ${url}`);
  return url;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  appSettings(app);

  await app.listen(port, () => {
    console.log(`App starting listen port: ${port}`);
  });

  const telegramAdapter = await app.resolve(TelegramAdapter);

  if (process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'development') {
    baseUrl = await connectToNgrok();
  }

  await telegramAdapter.setWebhook(baseUrl + `${Paths.telegram}/webhook`);
}
bootstrap();
