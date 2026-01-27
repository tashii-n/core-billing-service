import { Module } from '@nestjs/common';
import { PlanEntitlementsController } from './plan_entitlements.controller';
import { PlanEntitlementsService } from './plan_entitlements.service';
import { PlanEntitlementsRepository } from './plan_entitlements.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [PlanEntitlementsController],
  providers: [
    PlanEntitlementsService,
    PlanEntitlementsRepository,
    PrismaService,
  ],
})
export class PlanEntitlementsModule {}
