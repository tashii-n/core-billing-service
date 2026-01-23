// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './organization/organization.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), OrganizationModule],
})
export class AppModule {}
