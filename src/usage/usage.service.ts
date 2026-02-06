import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsageDto } from './dto/create-usage.dto';
import { BillingModel, Prisma } from '@prisma/client';

type CheckReason =
  | 'OK'
  | 'ORG_NOT_LINKED_TO_CLIENT_ID'
  | 'SERVICE_NOT_FOUND'
  | 'NO_ACTIVE_SUBSCRIPTION'
  | 'SUBSCRIPTION_NOT_STARTED'
  | 'SUBSCRIPTION_ENDED'
  | 'PLAN_NOT_FOUND'
  | 'NO_ENTITLEMENT_CONFIG'
  | 'QUOTA_EXCEEDED';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAccess(serviceCode: string, clientId: string) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    const now = new Date();

    // 1) Resolve org from JWT client_id
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

    // 2) Resolve service by service_code
    const service = await this.prisma.service.findUnique({
      where: { service_code: serviceCode },
      select: { service_id: true },
    });

    if (!service) {
      return { eligible: false, reason: 'SERVICE_NOT_FOUND' as CheckReason };
    }

    // 3) Find ACTIVE subscription for org+service
    const sub = await this.prisma.subscription.findFirst({
      where: {
        org_id: org.org_id,
        service_id: service.service_id,
        status: 'ACTIVE',
      },
      select: {
        subscription_id: true,
        plan_id: true,
        start_date: true,
        end_date: true,
      },
    });

    if (!sub) {
      return {
        eligible: false,
        reason: 'NO_ACTIVE_SUBSCRIPTION' as CheckReason,
      };
    }

    // 4) Term checks (lifetime window)
    const start = new Date(sub.start_date);
    if (now < start) {
      return {
        eligible: false,
        reason: 'SUBSCRIPTION_NOT_STARTED' as CheckReason,
        start_date: start,
      };
    }

    if (sub.end_date) {
      const end = new Date(sub.end_date);
      if (now >= end) {
        return {
          eligible: false,
          reason: 'SUBSCRIPTION_ENDED' as CheckReason,
          end_date: end,
        };
      }
    }

    // 5) Plan billing model
    const plan = await this.prisma.plan.findUnique({
      where: { plan_id: sub.plan_id },
      select: { billing_model: true },
    });

    if (!plan) {
      return { eligible: false, reason: 'PLAN_NOT_FOUND' as CheckReason };
    }

    // PAY_PER_USE has NO quota
    if (plan.billing_model === BillingModel.PAY_PER_USE) {
      return {
        eligible: true,
        reason: 'OK' as CheckReason,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    }

    // 6) Prepaid: hard-limit quota always
    const entitlement = await this.prisma.planEntitlement.findFirst({
      where: {
        plan_id: sub.plan_id,
        AND: [
          { OR: [{ org_type: org.org_type }, { org_type: null }] },
          { effective_from: { lte: now } },
          { OR: [{ effective_to: null }, { effective_to: { gt: now } }] },
        ],
      },
      orderBy: [{ org_type: 'desc' }, { effective_from: 'desc' }],
      select: { included_quantity: true },
    });

    if (!entitlement) {
      return {
        eligible: false,
        reason: 'NO_ENTITLEMENT_CONFIG' as CheckReason,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    }

    const counter = await this.prisma.usageCounter.findUnique({
      where: { subscription_id: sub.subscription_id },
      select: { count: true },
    });

    const used = counter?.count ?? 0;
    const limit = entitlement.included_quantity;
    const remaining = Math.max(limit - used, 0);

    if (used >= limit) {
      return {
        eligible: false,
        reason: 'QUOTA_EXCEEDED' as CheckReason,
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
      reason: 'OK' as CheckReason,
      billing_model: plan.billing_model,
      subscription_id: sub.subscription_id,
      plan_id: sub.plan_id,
      used,
      limit,
      remaining,
    };
  }

  async createUsage(dto: CreateUsageDto, clientId: string) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1) Resolve org from JWT client_id
      const org = await tx.organization.findUnique({
        where: { client_id: clientId },
        select: { org_id: true, org_type: true },
      });

      if (!org) throw new ForbiddenException('ORG_NOT_LINKED_TO_CLIENT_ID');

      // 2) Resolve service by service_code
      const service = await tx.service.findUnique({
        where: { service_code: dto.serviceCode },
        select: { service_id: true },
      });

      if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');

      // 3) Find ACTIVE subscription
      const sub = await tx.subscription.findFirst({
        where: {
          org_id: org.org_id,
          service_id: service.service_id,
          status: 'ACTIVE',
        },
        select: {
          subscription_id: true,
          plan_id: true,
          start_date: true,
          end_date: true,
        },
      });

      if (!sub) throw new NotFoundException('NO_ACTIVE_SUBSCRIPTION');

      // 4) Term checks
      if (now < new Date(sub.start_date)) {
        throw new BadRequestException('SUBSCRIPTION_NOT_STARTED');
      }
      if (sub.end_date && now >= new Date(sub.end_date)) {
        throw new BadRequestException('SUBSCRIPTION_ENDED');
      }

      // 5) Plan billing model
      const plan = await tx.plan.findUnique({
        where: { plan_id: sub.plan_id },
        select: { billing_model: true },
      });

      if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');

      // 6) If prepaid + SUCCESS, enforce hard quota BEFORE recording
      if (
        plan.billing_model === BillingModel.SUBSCRIPTION &&
        dto.result === 'SUCCESS'
      ) {
        const entitlement = await tx.planEntitlement.findFirst({
          where: {
            plan_id: sub.plan_id,
            AND: [
              { OR: [{ org_type: org.org_type }, { org_type: null }] },
              { effective_from: { lte: now } },
              { OR: [{ effective_to: null }, { effective_to: { gt: now } }] },
            ],
          },
          orderBy: [{ org_type: 'desc' }, { effective_from: 'desc' }],
          select: { included_quantity: true },
        });

        if (!entitlement)
          throw new BadRequestException('NO_ENTITLEMENT_CONFIG');

        const counter = await tx.usageCounter.findUnique({
          where: { subscription_id: sub.subscription_id },
          select: { count: true },
        });

        const used = counter?.count ?? 0;
        if (used >= entitlement.included_quantity) {
          throw new BadRequestException('QUOTA_EXCEEDED');
        }
      }

      // 7) Insert usage event (idempotent)
      try {
        await tx.usageEvent.create({
          data: {
            org_id: org.org_id,
            service_id: service.service_id,
            subscription_id: sub.subscription_id,
            plan_id: sub.plan_id,
            result: dto.result,
            external_ref: dto.threadId,
            // metadata: dto.metadata ?? undefined, // if you add later
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

      // 8) Increment lifetime usage counter ONLY on SUCCESS
      if (dto.result === 'SUCCESS') {
        await tx.usageCounter.upsert({
          where: { subscription_id: sub.subscription_id },
          create: { subscription_id: sub.subscription_id, count: 1 },
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
}
