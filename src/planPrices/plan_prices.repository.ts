import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanPrice, OrgType } from '@prisma/client';

@Injectable()
export class PlanPricesRepository {
  constructor(private prisma: PrismaService) {}

  create(data: {
    plan_id: number;
    org_type?: OrgType;
    currency?: string;
    fixed_fee: number;
    effective_from: Date;
    effective_to?: Date;
  }): Promise<PlanPrice> {
    return this.prisma.planPrice.create({ data });
  }

  findAll(): Promise<PlanPrice[]> {
    return this.prisma.planPrice.findMany({ include: { plan: true } });
  }

  findOne(plan_price_id: number): Promise<PlanPrice | null> {
    return this.prisma.planPrice.findUnique({
      where: { plan_price_id },
      include: { plan: true },
    });
  }

  update(
    plan_price_id: number,
    data: Partial<{
      org_type?: OrgType;
      currency?: string;
      fixed_fee?: number;
      effective_from?: Date;
      effective_to?: Date;
    }>,
  ): Promise<PlanPrice> {
    return this.prisma.planPrice.update({
      where: { plan_price_id },
      data,
    });
  }

  delete(plan_price_id: number): Promise<PlanPrice> {
    return this.prisma.planPrice.delete({ where: { plan_price_id } });
  }
}
