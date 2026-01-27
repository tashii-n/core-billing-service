import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrgType, PlanEntitlement } from '@prisma/client';

@Injectable()
export class PlanEntitlementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    plan_id: number;
    org_type?: OrgType;
    included_quantity: number;
    overage_unit_price?: number;
    hard_limit?: boolean;
    period: string;
    effective_from: Date;
    effective_to?: Date;
  }): Promise<PlanEntitlement> {
    return this.prisma.planEntitlement.create({ data });
  }

  findAll(): Promise<PlanEntitlement[]> {
    return this.prisma.planEntitlement.findMany({
      include: { plan: true },
    });
  }

  findOne(entitlement_id: number): Promise<PlanEntitlement | null> {
    return this.prisma.planEntitlement.findUnique({
      where: { entitlement_id },
      include: { plan: true },
    });
  }

  update(
    entitlement_id: number,
    data: Partial<{
      org_type?: OrgType;
      included_quantity: number;
      overage_unit_price?: number;
      hard_limit?: boolean;
      period: string;
      effective_from: Date;
      effective_to?: Date;
    }>,
  ): Promise<PlanEntitlement> {
    return this.prisma.planEntitlement.update({
      where: { entitlement_id },
      data,
    });
  }

  delete(entitlement_id: number): Promise<PlanEntitlement> {
    return this.prisma.planEntitlement.delete({
      where: { entitlement_id },
    });
  }
}
