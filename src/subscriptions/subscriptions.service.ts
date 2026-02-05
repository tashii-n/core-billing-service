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

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly repository: SubscriptionsRepository,
    private readonly prisma: PrismaService,
  ) {}

  private addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    const day = d.getDate();

    d.setDate(1);
    d.setMonth(d.getMonth() + months);

    const lastDayOfTargetMonth = new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      0,
    ).getDate();
    d.setDate(Math.min(day, lastDayOfTargetMonth));

    return d;
  }

  private monthsFromBillingPeriod(billing_period: string): number {
    const p = billing_period?.toUpperCase();
    if (p === 'MONTHLY') return 1;
    if (p === 'YEARLY') return 12;

    // If you keep it as String, guard hard here.
    // (Later you can switch this to an enum.)
    throw new BadRequestException(
      `Unsupported billing_period: ${billing_period}`,
    );
  }

  async create(dto: CreateSubscriptionDto) {
    const start = dto.start_date ? new Date(dto.start_date) : new Date();
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start_date');
    }

    // 1) Validate plan exists and belongs to the service (important)
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

    // 2) Enforce: only one ACTIVE subscription per org per service
    // (If you want to allow creating historical subscriptions directly, check only ACTIVE)
    const existingActive = await this.prisma.subscription.findFirst({
      where: {
        org_id: dto.org_id,
        service_id: dto.service_id,
        status: 'ACTIVE',
      },
      select: { subscription_id: true },
    });

    if (existingActive) {
      throw new BadRequestException('ACTIVE_SUBSCRIPTION_ALREADY_EXISTS');
    }

    // 3) Compute billing window from plan.billing_period
    const months = this.monthsFromBillingPeriod(plan.billing_period);
    const periodStart = start;
    const periodEnd = this.addMonths(periodStart, months);

    // Optional lifecycle end_date (usually null until canceled)
    const endDate = dto.end_date ? new Date(dto.end_date) : undefined;
    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid end_date');
    }
    if (endDate && endDate < start) {
      throw new BadRequestException('end_date cannot be before start_date');
    }

    return this.repository.create({
      org_id: dto.org_id,
      service_id: dto.service_id,
      plan_id: dto.plan_id,
      status: dto.status,

      start_date: start,
      end_date: endDate,

      current_period_start: periodStart,
      current_period_end: periodEnd,

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
    if (endDate && endDate < new Date(existing.start_date)) {
      throw new BadRequestException('end_date cannot be before start_date');
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

  async renew(subscription_id: number) {
    const sub = await this.findOne(subscription_id);

    if (sub.status !== 'ACTIVE') {
      throw new BadRequestException('Only ACTIVE subscriptions can be renewed');
    }

    if (sub.cancel_at_period_end) {
      return this.repository.update(subscription_id, {
        status: 'CANCELED',
        end_date: sub.current_period_end ?? new Date(),
      });
    }

    if (!sub.current_period_end) {
      throw new BadRequestException('SUBSCRIPTION_MISSING_BILLING_PERIOD');
    }

    // Get plan period length dynamically
    const plan = await this.prisma.plan.findUnique({
      where: { plan_id: sub.plan_id },
      select: { billing_period: true, is_active: true },
    });
    if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');
    if (!plan.is_active) throw new BadRequestException('PLAN_NOT_ACTIVE');

    const months = this.monthsFromBillingPeriod(plan.billing_period);

    const nextStart = new Date(sub.current_period_end);
    const nextEnd = this.addMonths(nextStart, months);

    return this.repository.update(subscription_id, {
      current_period_start: nextStart,
      current_period_end: nextEnd,
    });
  }
}
