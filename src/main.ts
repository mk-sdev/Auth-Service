import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://192.168.1.30:8081',
      'http://localhost:4200',
    ],
    credentials: true,
    exposedHeaders: ['Authorization'], // so that I could send headers to a browser
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Application failed to start', err);
  process.exit(1);
});
