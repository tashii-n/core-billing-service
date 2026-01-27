import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanEntitlementsRepository } from './plan_entitlements.repository';
import {
  CreatePlanEntitlementDto,
  UpdatePlanEntitlementDto,
} from './dto/plan_entitlements.dto';

@Injectable()
export class PlanEntitlementsService {
  constructor(private readonly repository: PlanEntitlementsRepository) {}

  create(dto: CreatePlanEntitlementDto) {
    return this.repository.create({
      plan_id: dto.plan_id,
      org_type: dto.org_type,
      included_quantity: dto.included_quantity,
      overage_unit_price: dto.overage_unit_price,
      hard_limit: dto.hard_limit,
      period: dto.period,
      effective_from: new Date(dto.effective_from),
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(entitlement_id: number) {
    const entitlement = await this.repository.findOne(entitlement_id);
    if (!entitlement) {
      throw new NotFoundException('PlanEntitlement not found');
    }
    return entitlement;
  }

  async update(entitlement_id: number, dto: UpdatePlanEntitlementDto) {
    await this.findOne(entitlement_id);

    return this.repository.update(entitlement_id, {
      org_type: dto.org_type,
      included_quantity: dto.included_quantity,
      overage_unit_price: dto.overage_unit_price,
      hard_limit: dto.hard_limit,
      period: dto.period,
      effective_from: dto.effective_from
        ? new Date(dto.effective_from)
        : undefined,
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  async delete(entitlement_id: number) {
    await this.findOne(entitlement_id);
    return this.repository.delete(entitlement_id);
  }
}
