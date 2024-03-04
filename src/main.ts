import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSettings } from './app.settings';

const port = process.env.PORT || 5000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  appSettings(app);

  await app.listen(port, () => {
    console.log(`App starting listen port: ${port}`);
  });
}
bootstrap();
