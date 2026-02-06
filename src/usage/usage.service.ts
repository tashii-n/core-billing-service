// src/usage/usage.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsageDto } from './dto/create-usage.dto';
import { BillingModel, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

type CheckReason =
  | 'OK'
  | 'ORG_NOT_LINKED_TO_CLIENT_ID'
  | 'SERVICE_NOT_FOUND'
  | 'NO_ACTIVE_SUBSCRIPTION'
  | 'SUBSCRIPTION_NOT_STARTED'
  | 'SUBSCRIPTION_ENDED'
  | 'PLAN_NOT_FOUND'
  | 'NO_PREPAID_TERM_CONFIG'
  | 'QUOTA_EXCEEDED';

@Injectable()
export class UsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get coreClientId(): string {
    return this.config.get<string>('CORE_CLIENT_ID') ?? '';
  }

  private isCoreCaller(clientId: string | undefined): boolean {
    return Boolean(
      clientId && this.coreClientId && clientId === this.coreClientId,
    );
  }

  private async resolveOrg(
    tx: PrismaService,
    clientId: string | undefined,
    orgDid?: string,
  ) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    if (this.isCoreCaller(clientId)) {
      if (!orgDid) throw new BadRequestException('MISSING_ORG_DID_FOR_CORE');

      const org = await (tx as any).organization.findUnique({
        where: { org_did: orgDid },
        select: { org_id: true, org_type: true, is_active: true },
      });

      if (!org) throw new NotFoundException('ORG_NOT_FOUND');
      if (!org.is_active) throw new BadRequestException('ORG_NOT_ACTIVE');
      return org;
    }

    const org = await (tx as any).organization.findUnique({
      where: { client_id: clientId },
      select: { org_id: true, org_type: true, is_active: true },
    });

    if (!org) throw new ForbiddenException('ORG_NOT_LINKED_TO_CLIENT_ID');
    if (!org.is_active) throw new BadRequestException('ORG_NOT_ACTIVE');
    return org;
  }

  async checkAccess(
    serviceCode: string,
    clientId: string | undefined,
    orgDid?: string,
  ) {
    const now = new Date();

    // 1) Resolve org (CORE override supported)
    let org: { org_id: number; org_type: any };
    try {
      org = await this.resolveOrg(this.prisma as any, clientId, orgDid);
    } catch (e: any) {
      // For check endpoint, prefer a structured "eligible:false" instead of throwing
      if (e instanceof ForbiddenException) {
        return {
          eligible: false,
          reason: 'ORG_NOT_LINKED_TO_CLIENT_ID' as CheckReason,
        };
      }
      if (e instanceof NotFoundException) {
        return {
          eligible: false,
          reason: 'ORG_NOT_LINKED_TO_CLIENT_ID' as CheckReason,
        };
      }
      throw e;
    }

    // 2) Resolve service
    const service = await this.prisma.service.findUnique({
      where: { service_code: serviceCode },
      select: { service_id: true },
    });
    if (!service)
      return { eligible: false, reason: 'SERVICE_NOT_FOUND' as CheckReason };

    // 3) Find ACTIVE subscription
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
    if (!sub)
      return {
        eligible: false,
        reason: 'NO_ACTIVE_SUBSCRIPTION' as CheckReason,
      };

    // 4) Term checks
    if (now < new Date(sub.start_date)) {
      return {
        eligible: false,
        reason: 'SUBSCRIPTION_NOT_STARTED' as CheckReason,
      };
    }
    if (sub.end_date && now >= new Date(sub.end_date)) {
      return { eligible: false, reason: 'SUBSCRIPTION_ENDED' as CheckReason };
    }

    // 5) Plan model
    const plan = await this.prisma.plan.findUnique({
      where: { plan_id: sub.plan_id },
      select: { billing_model: true },
    });
    if (!plan)
      return { eligible: false, reason: 'PLAN_NOT_FOUND' as CheckReason };

    // 6) PAY_PER_USE: no quota
    if (plan.billing_model === BillingModel.PAY_PER_USE) {
      return {
        eligible: true,
        reason: 'OK' as CheckReason,
        billing_model: plan.billing_model,
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    }

    // 7) Prepaid: quota is frozen per subscription in SubscriptionPrepaidTerm
    const term = await this.prisma.subscriptionPrepaidTerm.findUnique({
      where: { subscription_id: sub.subscription_id },
      select: { included_quantity: true, hard_limit: true },
    });
    if (!term) {
      return {
        eligible: false,
        reason: 'NO_PREPAID_TERM_CONFIG' as CheckReason,
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
    const limit = term.included_quantity;
    const remaining = Math.max(limit - used, 0);

    if (term.hard_limit && used >= limit) {
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

  async createUsage(dto: CreateUsageDto, clientId: string | undefined) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1) Resolve org (CORE override supported)
      const org = await this.resolveOrg(tx as any, clientId, dto.orgDid);

      // 2) Resolve service
      const service = await (tx as any).service.findUnique({
        where: { service_code: dto.serviceCode },
        select: { service_id: true },
      });
      if (!service) throw new NotFoundException('SERVICE_NOT_FOUND');

      // 3) Find ACTIVE subscription
      const sub = await (tx as any).subscription.findFirst({
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

      // 5) Plan model
      const plan = await (tx as any).plan.findUnique({
        where: { plan_id: sub.plan_id },
        select: { billing_model: true },
      });
      if (!plan) throw new NotFoundException('PLAN_NOT_FOUND');

      // 6) Prepaid quota enforcement before recording SUCCESS
      if (
        plan.billing_model === BillingModel.SUBSCRIPTION &&
        dto.result === 'SUCCESS'
      ) {
        const term = await (tx as any).subscriptionPrepaidTerm.findUnique({
          where: { subscription_id: sub.subscription_id },
          select: { included_quantity: true, hard_limit: true },
        });

        if (!term) throw new BadRequestException('NO_PREPAID_TERM_CONFIG');

        const counter = await (tx as any).usageCounter.findUnique({
          where: { subscription_id: sub.subscription_id },
          select: { count: true },
        });

        const used = counter?.count ?? 0;
        if (term.hard_limit && used >= term.included_quantity) {
          throw new BadRequestException('QUOTA_EXCEEDED');
        }
      }

      // 7) Insert usage event (idempotent per subscription)
      try {
        await (tx as any).usageEvent.create({
          data: {
            org_id: org.org_id,
            service_id: service.service_id,
            subscription_id: sub.subscription_id,
            plan_id: sub.plan_id,
            result: dto.result,
            external_ref: dto.threadId,
            metadata: dto.metadata ?? undefined,
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

      // 8) Increment lifetime counter on SUCCESS only
      if (dto.result === 'SUCCESS') {
        await (tx as any).usageCounter.upsert({
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
