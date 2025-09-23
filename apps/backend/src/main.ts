import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://www.theglamstore.ng',
      'https://theglamstore.ng',
      process.env.WEB_APP_ORIGIN,
    ].filter(Boolean),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start NestJS app:', err);
  process.exit(1);
});
