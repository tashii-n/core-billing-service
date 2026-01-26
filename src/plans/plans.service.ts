import { Injectable, NotFoundException } from '@nestjs/common';
import { PlansRepository } from './plans.repository';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';

@Injectable()
export class PlansService {
  constructor(private readonly repository: PlansRepository) {}

  create(dto: CreatePlanDto) {
    return this.repository.create({
      ...dto,
      service_id: Number(dto.service_id),
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(id: number) {
    const plan = await this.repository.findOne(id);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async update(id: number, dto: UpdatePlanDto) {
    await this.findOne(id);
    return this.repository.update(id, dto);
  }

  async delete(id: number) {
    await this.findOne(id);
    return this.repository.delete(id);
  }
}
