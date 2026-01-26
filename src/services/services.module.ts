// services.module.ts
import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { ServicesRepository } from './service.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository, PrismaService],
})
export class ServicesModule {}
