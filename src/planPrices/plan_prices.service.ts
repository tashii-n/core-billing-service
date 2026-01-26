import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanPricesRepository } from './plan_prices.repository';
import { CreatePlanPriceDto, UpdatePlanPriceDto } from './dto/plan_prices.dto';

@Injectable()
export class PlanPricesService {
  constructor(private readonly repository: PlanPricesRepository) {}

  create(dto: CreatePlanPriceDto) {
    return this.repository.create({
      plan_id: dto.plan_id,
      org_type: dto.org_type,
      currency: dto.currency,
      fixed_fee: dto.fixed_fee,
      effective_from: new Date(dto.effective_from),
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(plan_price_id: number) {
    const price = await this.repository.findOne(plan_price_id);
    if (!price) throw new NotFoundException('PlanPrice not found');
    return price;
  }

  async update(plan_price_id: number, dto: UpdatePlanPriceDto) {
    await this.findOne(plan_price_id);
    return this.repository.update(plan_price_id, {
      org_type: dto.org_type,
      currency: dto.currency,
      fixed_fee: dto.fixed_fee,
      effective_from: dto.effective_from
        ? new Date(dto.effective_from)
        : undefined,
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  async delete(plan_price_id: number) {
    await this.findOne(plan_price_id);
    return this.repository.delete(plan_price_id);
  }
}
