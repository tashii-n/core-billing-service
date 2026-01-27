import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscriptions.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly repository: SubscriptionsRepository) {}

  create(dto: CreateSubscriptionDto) {
    return this.repository.create({
      org_id: dto.org_id,
      service_id: dto.service_id,
      plan_id: dto.plan_id,
      status: dto.status,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      cancel_at_period_end: dto.cancel_at_period_end ?? false,
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(subscription_id: number) {
    const subscription = await this.repository.findOne(subscription_id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }

  async update(subscription_id: number, dto: UpdateSubscriptionDto) {
    await this.findOne(subscription_id);

    return this.repository.update(subscription_id, {
      status: dto.status,
      end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      cancel_at_period_end: dto.cancel_at_period_end,
      current_period_start: dto.current_period_start
        ? new Date(dto.current_period_start)
        : undefined,
      current_period_end: dto.current_period_end
        ? new Date(dto.current_period_end)
        : undefined,
    });
  }

  async delete(subscription_id: number) {
    await this.findOne(subscription_id);
    return this.repository.delete(subscription_id);
  }
}
