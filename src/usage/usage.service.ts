import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUsageDto } from './dto/create-usage.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async createUsage(dto: CreateUsageDto, clientId: string) {
    if (!clientId) throw new ForbiddenException('MISSING_CLIENT_ID');

    return this.prisma.$transaction(async (tx) => {
      // 1) Resolve organization by client_id (from token)
      const org = await tx.organization.findUnique({
        where: { client_id: clientId },
        select: { org_id: true },
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
          current_period_start: true,
          current_period_end: true,
        },
      });

      if (!sub) throw new NotFoundException('NO_ACTIVE_SUBSCRIPTION');

      // Use billing period fields (not start_date/end_date)
      if (!sub.current_period_start || !sub.current_period_end) {
        throw new BadRequestException('SUBSCRIPTION_MISSING_BILLING_PERIOD');
      }

      // 4) Insert usage event (idempotent)
      try {
        await tx.usageEvent.create({
          data: {
            org_id: org.org_id,
            service_id: service.service_id,
            subscription_id: sub.subscription_id,
            plan_id: sub.plan_id,
            result: dto.result,
            external_ref: dto.threadId,
            // Optional audit info:
            // metadata: { client_id: clientId, service_code: dto.serviceCode },
          },
        });
      } catch (e: any) {
        // Prisma unique constraint violation on external_ref
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          // Duplicate call => don't increment again
          return { status: 'DUPLICATE' };
        }
        throw e;
      }

      // 5) Increment counter ONLY on SUCCESS
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
          update: {
            count: { increment: 1 },
          },
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
