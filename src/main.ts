import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { BigIntSerializerInterceptor } from './common/interceptors/bigint-serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown props
      forbidNonWhitelisted: true, // 400 if unknown props sent
      transform: true, // auto-transform payloads to DTO classes
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Convert BigInt values to strings in all JSON responses
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  // after creating app
  const prisma = app.get(PrismaService);
  app.enableShutdownHooks();

  await app.listen(3001);
}
bootstrap();
