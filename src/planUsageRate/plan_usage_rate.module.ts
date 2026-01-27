import { Module } from '@nestjs/common';
import { PlanUsageRateController } from './plan_usage_rate.controller';
import { PlanUsageRateService } from './plan_usage_rate.service';
import { PlanUsageRateRepository } from './plan_usage_rate.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PlanUsageRateController],
  providers: [PlanUsageRateService, PlanUsageRateRepository, PrismaService],
})
export class PlanUsageRateModule {}
