// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './organization/organization.module';
import { AuthModule } from './auth/auth.module';
import { config } from '@config/config';
import { validationSchema } from '@config/validation';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      envFilePath: `${process.cwd()}/.env`,
      validationSchema,
    }),
    AuthModule,
    OrganizationModule,
    ServicesModule,
  ],
})
export class AppModule {}
