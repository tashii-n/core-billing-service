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
import {
  BillingModel,
  PricingSource,
  SubscriptionStatus,
} from '@prisma/client';

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

    return this.prisma.$transaction(async (tx) => {
      // 0) Validate org exists (needed for org_type when pricing_source=TEMPLATE)
      const org = await tx.organization.findUnique({
        where: { org_id: dto.org_id },
        select: { org_id: true, org_type: true, is_active: true },
      });
      if (!org) throw new NotFoundException('ORG_NOT_FOUND');
      if (!org.is_active) throw new BadRequestException('ORG_NOT_ACTIVE');

      // 1) Validate plan exists, active, and matches service
      const plan = await tx.plan.findUnique({
        where: { plan_id: dto.plan_id },
        select: {
          plan_id: true,
          service_id: true,
          billing_period: true,
          is_active: true,
          billing_model: true,
        },
      });
      if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');
      if (!plan.is_active) throw new BadRequestException('PLAN_NOT_ACTIVE');
      if (plan.service_id !== dto.service_id) {
        throw new BadRequestException('PLAN_SERVICE_MISMATCH');
      }

      // 2) Enforce only one ACTIVE subscription per org+service
      if (dto.status === SubscriptionStatus.ACTIVE) {
        const existingActive = await tx.subscription.findFirst({
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

      // 3) Compute end_date automatically from plan term length (override allowed)
      const months = this.monthsFromBillingPeriod(plan.billing_period);
      const autoEndDate = this.addMonths(start, months);

      const overrideEnd = dto.end_date ? new Date(dto.end_date) : undefined;
      if (overrideEnd && Number.isNaN(overrideEnd.getTime())) {
        throw new BadRequestException('Invalid end_date');
      }

      const finalEndDate = overrideEnd ?? autoEndDate;
      if (finalEndDate <= start) {
        throw new BadRequestException('end_date must be after start_date');
      }

      // 4) Create subscription row first
      const subscription = await tx.subscription.create({
        data: {
          org_id: dto.org_id,
          service_id: dto.service_id,
          plan_id: dto.plan_id,
          status: dto.status,
          start_date: start,
          end_date: finalEndDate,
          cancel_at_period_end: dto.cancel_at_period_end ?? false,
        },
        select: {
          subscription_id: true,
          org_id: true,
          service_id: true,
          plan_id: true,
        },
      });

      // 5) Create prepaid term only for prepaid model (SUBSCRIPTION)
      if (plan.billing_model === BillingModel.SUBSCRIPTION) {
        if (!dto.pricing_source) {
          throw new BadRequestException('MISSING_PRICING_SOURCE');
        }

        if (dto.pricing_source === PricingSource.NEGOTIATED) {
          // Require custom negotiated values
          if (dto.fixed_fee == null) {
            throw new BadRequestException('MISSING_NEGOTIATED_FIXED_FEE');
          }

          if (dto.included_quantity == null) {
            throw new BadRequestException(
              'MISSING_NEGOTIATED_INCLUDED_QUANTITY',
            );
          }

          await tx.subscriptionPrepaidTerm.create({
            data: {
              subscription_id: subscription.subscription_id,
              pricing_source: PricingSource.NEGOTIATED,

              currency: dto.currency ?? 'BTN',
              fixed_fee: dto.fixed_fee, // string is OK for Prisma Decimal
              included_quantity: dto.included_quantity,

              hard_limit: true,
              overage_unit_price: dto.overage_unit_price ?? null,

              source_plan_price_id: null,
              source_plan_entitlement_id: null,
            },
          });
        } else if (dto.pricing_source === PricingSource.TEMPLATE) {
          const now = new Date();

          const planPrice = await tx.planPrice.findFirst({
            where: {
              plan_id: plan.plan_id,
              AND: [
                { effective_from: { lte: now } },
                { OR: [{ effective_to: null }, { effective_to: { gt: now } }] },
                { OR: [{ org_type: org.org_type }, { org_type: null }] },
              ],
            },
            orderBy: [{ org_type: 'desc' }, { effective_from: 'desc' }],
            select: {
              plan_price_id: true,
              currency: true,
              fixed_fee: true,
            },
          });
          if (!planPrice)
            throw new BadRequestException('NO_TEMPLATE_PLAN_PRICE');

          const entitlement = await tx.planEntitlement.findFirst({
            where: {
              plan_id: plan.plan_id,
              AND: [
                { effective_from: { lte: now } },
                { OR: [{ effective_to: null }, { effective_to: { gt: now } }] },
                { OR: [{ org_type: org.org_type }, { org_type: null }] },
              ],
            },
            orderBy: [{ org_type: 'desc' }, { effective_from: 'desc' }],
            select: {
              entitlement_id: true,
              included_quantity: true,
              overage_unit_price: true,
            },
          });
          if (!entitlement)
            throw new BadRequestException('NO_TEMPLATE_ENTITLEMENT');

          await tx.subscriptionPrepaidTerm.create({
            data: {
              subscription_id: subscription.subscription_id,
              pricing_source: PricingSource.TEMPLATE,

              currency: planPrice.currency ?? 'BTN',
              fixed_fee: planPrice.fixed_fee,
              included_quantity: entitlement.included_quantity,

              hard_limit: true,
              overage_unit_price: entitlement.overage_unit_price ?? null,

              source_plan_price_id: planPrice.plan_price_id,
              source_plan_entitlement_id: entitlement.entitlement_id,
            },
          });
        } else {
          throw new BadRequestException('INVALID_PRICING_SOURCE');
        }
      } else {
        // PAY_PER_USE: no prepaid terms allowed
        if (
          dto.pricing_source != null ||
          dto.fixed_fee != null ||
          dto.included_quantity != null ||
          dto.overage_unit_price != null
        ) {
          throw new BadRequestException(
            'POSTPAID_DOES_NOT_SUPPORT_PREPAID_TERMS',
          );
        }
      }

      return {
        success: true,
        message: 'Subscription created successfully',
        data: subscription,
      };
    });
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(subscription_id: number) {
    const subscription = await this.repository.findOne(subscription_id);
    if (!subscription) throw new NotFoundException('Subscription not found');
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
