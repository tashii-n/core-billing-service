// src/main.ts
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Billing Service API')
    .setDescription('API documentation')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/billing/swagger', app, document);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const port = configService.get('PORT') || 3010;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await app.listen(port);

  Logger.log(`🚀 Application is listening on: ${port}`);

  Logger.log('📘 Swagger UI path: /billing/swagger');
}
bootstrap();
