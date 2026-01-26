import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingModel, Plan, PlanCode } from '@prisma/client';

@Injectable()
export class PlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    service_id: number;
    plan_code: PlanCode;
    billing_period: string;
    billing_model: BillingModel;
    is_active?: boolean;
  }): Promise<Plan> {
    return this.prisma.plan.create({ data });
  }

  findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      include: { service: true },
    });
  }

  findOne(plan_id: number): Promise<Plan | null> {
    return this.prisma.plan.findUnique({
      where: { plan_id },
      include: { service: true },
    });
  }

  update(
    plan_id: number,
    data: Partial<{
      plan_code: PlanCode;
      billing_period: string;
      billing_model: BillingModel;
      is_active: boolean;
    }>,
  ): Promise<Plan> {
    return this.prisma.plan.update({
      where: { plan_id },
      data,
    });
  }

  delete(plan_id: number): Promise<Plan> {
    return this.prisma.plan.delete({
      where: { plan_id },
    });
  }
}
