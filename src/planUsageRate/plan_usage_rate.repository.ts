import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanUsageRate } from '@prisma/client';

@Injectable()
export class PlanUsageRateRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    plan_id: number;
    unit_price: number;
    effective_from: Date;
    effective_to?: Date;
  }): Promise<PlanUsageRate> {
    return this.prisma.planUsageRate.create({ data });
  }

  findAll(): Promise<PlanUsageRate[]> {
    return this.prisma.planUsageRate.findMany({
      include: { plan: true },
    });
  }

  findOne(rate_id: number): Promise<PlanUsageRate | null> {
    return this.prisma.planUsageRate.findUnique({
      where: { rate_id },
      include: { plan: true },
    });
  }

  update(
    rate_id: number,
    data: Partial<{
      unit_price: number;
      effective_from: Date;
      effective_to?: Date;
    }>,
  ): Promise<PlanUsageRate> {
    return this.prisma.planUsageRate.update({
      where: { rate_id },
      data,
    });
  }

  delete(rate_id: number): Promise<PlanUsageRate> {
    return this.prisma.planUsageRate.delete({
      where: { rate_id },
    });
  }
}
