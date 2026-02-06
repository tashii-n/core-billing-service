import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscriptions.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly repository: SubscriptionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Adds N calendar months.
   * Example: 2026-02-05 -> 2027-02-05 (for 12 months)
   * Edge: Jan 31 + 1 month -> Feb 28/29 (clamped)
   */
  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    const day = d.getDate();

    d.setDate(1);
    d.setMonth(d.getMonth() + months);

    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, lastDay));

    return d;
  }

  private monthsFromBillingPeriod(billing_period: string): number {
    const p = billing_period?.toUpperCase();
    if (p === 'MONTHLY') return 1;
    if (p === 'YEARLY') return 12;
    throw new BadRequestException(
      `Unsupported billing_period: ${billing_period}`,
    );
  }

  async create(dto: CreateSubscriptionDto) {
    const start = dto.start_date ? new Date(dto.start_date) : new Date();
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start_date');
    }

    // 1) Validate plan exists, active, and matches service
    const plan = await this.prisma.plan.findUnique({
      where: { plan_id: dto.plan_id },
      select: {
        plan_id: true,
        service_id: true,
        billing_period: true,
        is_active: true,
      },
    });
    if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');
    if (!plan.is_active) throw new BadRequestException('PLAN_NOT_ACTIVE');
    if (plan.service_id !== dto.service_id) {
      throw new BadRequestException('PLAN_SERVICE_MISMATCH');
    }

    // 2) Enforce only one ACTIVE subscription per org+service
    // Only enforce when creating an ACTIVE subscription.
    if (dto.status === SubscriptionStatus.ACTIVE) {
      const existingActive = await this.prisma.subscription.findFirst({
        where: {
          org_id: dto.org_id,
          service_id: dto.service_id,
          status: SubscriptionStatus.ACTIVE,
        },
        select: { subscription_id: true },
      });

      if (existingActive) {
        throw new BadRequestException('ACTIVE_SUBSCRIPTION_ALREADY_EXISTS');
      }
    }

    // 3) Compute end_date automatically from plan term length
    const months = this.monthsFromBillingPeriod(plan.billing_period);
    const autoEndDate = this.addMonths(start, months);

    // Admin override (optional): if end_date provided, accept it but validate
    const overrideEnd = dto.end_date ? new Date(dto.end_date) : undefined;
    if (overrideEnd && Number.isNaN(overrideEnd.getTime())) {
      throw new BadRequestException('Invalid end_date');
    }

    const finalEndDate = overrideEnd ?? autoEndDate;

    if (finalEndDate <= start) {
      throw new BadRequestException('end_date must be after start_date');
    }

    return this.repository.create({
      org_id: dto.org_id,
      service_id: dto.service_id,
      plan_id: dto.plan_id,
      status: dto.status,

      start_date: start,
      end_date: finalEndDate,

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
    const existing = await this.findOne(subscription_id);

    const endDate = dto.end_date ? new Date(dto.end_date) : undefined;
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid end_date');
    }
    if (endDate && endDate <= new Date(existing.start_date)) {
      throw new BadRequestException('end_date must be after start_date');
    }

    // If someone tries to set status to ACTIVE, enforce that this org+service has no other ACTIVE subscription
    if (dto.status === SubscriptionStatus.ACTIVE) {
      const conflict = await this.prisma.subscription.findFirst({
        where: {
          org_id: existing.org_id,
          service_id: existing.service_id,
          status: SubscriptionStatus.ACTIVE,
          NOT: { subscription_id },
        },
        select: { subscription_id: true },
      });

      if (conflict) {
        throw new BadRequestException('ACTIVE_SUBSCRIPTION_ALREADY_EXISTS');
      }
    }

    return this.repository.update(subscription_id, {
      status: dto.status,
      end_date: endDate,
      cancel_at_period_end: dto.cancel_at_period_end,
    });
  }

  async delete(subscription_id: number) {
    await this.findOne(subscription_id);
    return this.repository.delete(subscription_id);
  }
}
