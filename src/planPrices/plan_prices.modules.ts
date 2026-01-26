import { Module } from '@nestjs/common';
import { PlanPricesController } from './plan_prices.controller';
import { PlanPricesService } from './plan_prices.service';
import { PlanPricesRepository } from './plan_prices.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PlanPricesController],
  providers: [PlanPricesService, PlanPricesRepository, PrismaService],
})
export class PlanPricesModule {}
