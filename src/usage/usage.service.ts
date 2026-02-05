import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsageDto } from './dto/create-usage.dto';
import { Prisma, BillingModel } from '@prisma/client';

type CheckReason =
  | 'OK'
  | 'ORG_NOT_LINKED_TO_CLIENT_ID'
  | 'SERVICE_NOT_FOUND'
  | 'NO_ACTIVE_SUBSCRIPTION'
  | 'SUBSCRIPTION_MISSING_BILLING_PERIOD'
  | 'OUTSIDE_BILLING_PERIOD'
  | 'SUBSCRIPTION_ENDED'
  | 'NO_ENTITLEMENT_CONFIG'
  | 'QUOTA_EXCEEDED';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async createUsage(dto: CreateUsageDto, clientId: string) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { client_id: clientId },
        select: { org_id: true },
      });
      if (!org) throw new ForbiddenException('ORG_NOT_LINKED_TO_CLIENT_ID');

      const service = await tx.service.findUnique({
        where: { service_code: dto.serviceCode },
        select: { service_id: true },
      });
      if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');

      const sub = await tx.subscription.findFirst({
        where: {
          org_id: org.org_id,
          service_id: service.service_id,
          status: 'ACTIVE',
        },
        select: {
          subscription_id: true,
          plan_id: true,
          current_period_start: true,
          current_period_end: true,
        },
      });

      if (!sub) throw new NotFoundException('NO_ACTIVE_SUBSCRIPTION');
      if (!sub.current_period_start || !sub.current_period_end) {
        throw new BadRequestException('SUBSCRIPTION_MISSING_BILLING_PERIOD');
      }

      try {
        await tx.usageEvent.create({
          data: {
            org_id: org.org_id,
            service_id: service.service_id,
            subscription_id: sub.subscription_id,
            plan_id: sub.plan_id,
            result: dto.result,
            external_ref: dto.threadId,
          },
        });
      } catch (e: any) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          return { status: 'DUPLICATE' };
        }
        throw e;
      }

      if (dto.result === 'SUCCESS') {
        await tx.usageCounter.upsert({
          where: {
            subscription_id_period_start_period_end: {
              subscription_id: sub.subscription_id,
              period_start: sub.current_period_start,
              period_end: sub.current_period_end,
            },
          },
          create: {
            subscription_id: sub.subscription_id,
            period_start: sub.current_period_start,
            period_end: sub.current_period_end,
            count: 1,
          },
          update: { count: { increment: 1 } },
        });
      }

      return {
        status: 'RECORDED',
        counted: dto.result === 'SUCCESS',
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    });
  }

  /**
   * Check if org can use a service now.
   * - PAY_PER_USE: no quota check
   * - SUBSCRIPTION: enforce entitlement quota if configured (hard_limit)
   */
  async checkAccess(serviceCode: string, clientId: string) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    const now = new Date();

    // 1) org from token client_id
    const org = await this.prisma.organization.findUnique({
      where: { client_id: clientId },
      select: { org_id: true, org_type: true },
    });

    if (!org) {
      return {
        eligible: false,
        reason: 'ORG_NOT_LINKED_TO_CLIENT_ID' as CheckReason,
      };
    }

    // 2) service
    const service = await this.prisma.service.findUnique({
      where: { service_code: serviceCode },
      select: { service_id: true },
    });

    if (!service) {
      return { eligible: false, reason: 'SERVICE_NOT_FOUND' as CheckReason };
    }

    // 3) active subscription
    const sub = await this.prisma.subscription.findFirst({
      where: {
        org_id: org.org_id,
        service_id: service.service_id,
        status: 'ACTIVE',
      },
      select: {
        subscription_id: true,
        plan_id: true,
        end_date: true,
        current_period_start: true,
        current_period_end: true,
      },
    });

    if (!sub) {
      return {
        eligible: false,
        reason: 'NO_ACTIVE_SUBSCRIPTION' as CheckReason,
      };
    }

    // 4) end_date lifecycle check (if used)
    if (sub.end_date && now >= new Date(sub.end_date)) {
      return { eligible: false, reason: 'SUBSCRIPTION_ENDED' as CheckReason };
    }

    // 5) period window check
    if (!sub.current_period_start || !sub.current_period_end) {
      return {
        eligible: false,
        reason: 'SUBSCRIPTION_MISSING_BILLING_PERIOD' as CheckReason,
      };
    }

    const periodStart = new Date(sub.current_period_start);
    const periodEnd = new Date(sub.current_period_end);

    if (!(now >= periodStart && now < periodEnd)) {
      return {
        eligible: false,
        reason: 'OUTSIDE_BILLING_PERIOD' as CheckReason,
        periodStart,
        periodEnd,
      };
    }

    // 6) plan model
    const plan = await this.prisma.plan.findUnique({
      where: { plan_id: sub.plan_id },
      select: { billing_model: true },
    });

    if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');

    // PAY_PER_USE: no quotas
    if (plan.billing_model === BillingModel.PAY_PER_USE) {
      return {
        eligible: true,
        reason: 'OK' as CheckReason,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
        periodStart,
        periodEnd,
      };
    }

    // SUBSCRIPTION: enforce quota (hard limit always)
    const entitlement = await this.prisma.planEntitlement.findFirst({
      where: {
        plan_id: sub.plan_id,
        AND: [
          {
            OR: [{ org_type: org.org_type }, { org_type: null }],
          },
          {
            effective_from: { lte: now },
          },
          {
            OR: [{ effective_to: null }, { effective_to: { gt: now } }],
          },
        ],
      },
      orderBy: [
        { org_type: 'desc' }, // prefer org-specific
        { effective_from: 'desc' }, // newest rule
      ],
      select: {
        included_quantity: true,
      },
    });

    if (!entitlement) {
      return {
        eligible: false,
        reason: 'NO_ENTITLEMENT_CONFIG' as const,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    }

    const counter = await this.prisma.usageCounter.findUnique({
      where: {
        subscription_id_period_start_period_end: {
          subscription_id: sub.subscription_id,
          period_start: periodStart,
          period_end: periodEnd,
        },
      },
      select: { count: true },
    });

    const used = counter?.count ?? 0;
    const limit = entitlement.included_quantity;
    const remaining = Math.max(limit - used, 0);

    // hard limit ALWAYS
    if (used >= limit) {
      return {
        eligible: false,
        reason: 'QUOTA_EXCEEDED' as const,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
        used,
        limit,
        remaining,
      };
    }

    return {
      eligible: true,
      reason: 'OK' as const,
      billing_model: plan.billing_model,
      subscription_id: sub.subscription_id,
      plan_id: sub.plan_id,
      periodStart,
      periodEnd,
      used,
      limit,
      remaining,
    };
  }
}
