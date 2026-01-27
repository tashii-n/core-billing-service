import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanUsageRateRepository } from './plan_usage_rate.repository';
import {
  CreatePlanUsageRateDto,
  UpdatePlanUsageRateDto,
} from './dto/plan_usage_rate.dto';

@Injectable()
export class PlanUsageRateService {
  constructor(private readonly repository: PlanUsageRateRepository) {}

  create(dto: CreatePlanUsageRateDto) {
    return this.repository.create({
      plan_id: dto.plan_id,
      unit_price: dto.unit_price,
      effective_from: new Date(dto.effective_from),
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(rate_id: number) {
    const rate = await this.repository.findOne(rate_id);
    if (!rate) {
      throw new NotFoundException('Plan usage rate not found');
    }
    return rate;
  }

  async update(rate_id: number, dto: UpdatePlanUsageRateDto) {
    await this.findOne(rate_id);

    return this.repository.update(rate_id, {
      unit_price: dto.unit_price,
      effective_from: dto.effective_from
        ? new Date(dto.effective_from)
        : undefined,
      effective_to: dto.effective_to ? new Date(dto.effective_to) : undefined,
    });
  }

  async delete(rate_id: number) {
    await this.findOne(rate_id);
    return this.repository.delete(rate_id);
  }
}
