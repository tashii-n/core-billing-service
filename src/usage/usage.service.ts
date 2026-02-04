import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { CreateUsageDto } from "./dto/create-usage.dto";

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async createUsage(dto: CreateUsageDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1) Resolve org
      const org = await tx.organization.findUnique({
        where: { org_did: dto.orgDid },
        select: { org_id: true },
      });
      if (!org) throw new NotFoundException("ORG_NOT_FOUND");

      // 2) Validate service exists
      const service = await tx.service.findUnique({
        where: { service_id: dto.serviceId },
        select: { service_id: true },
      });
      if (!service) throw new NotFoundException("SERVICE_NOT_FOUND");

      // 3) Find ACTIVE subscription for this org + service
      const sub = await tx.subscription.findFirst({
        where: {
          org_id: org.org_id,
          service_id: dto.serviceId,
          status: "ACTIVE",
        },
        select: {
          subscription_id: true,
          plan_id: true,
          current_period_start: true,
          current_period_end: true,
        },
      });

      if (!sub) throw new NotFoundException("NO_ACTIVE_SUBSCRIPTION");

      if (!sub.current_period_start || !sub.current_period_end) {
        throw new BadRequestException("SUBSCRIPTION_MISSING_BILLING_PERIOD");
      }

      // 4) Insert usage event (idempotent)
      // external_ref = threadId ensures retries don't double record
      try {
        await tx.usageEvent.create({
          data: {
            org_id: org.org_id,
            service_id: dto.serviceId,
            subscription_id: sub.subscription_id,
            plan_id: sub.plan_id,
            result: dto.result,
            external_ref: dto.threadId,
          },
        });
      } catch (e: any) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          // already recorded -> do NOT increment counter again
          return { status: "DUPLICATE" };
        }
        throw e;
      }

      // 5) Increment counter ONLY for SUCCESS
      if (dto.result === "SUCCESS") {
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
        status: "RECORDED",
        counted: dto.result === "SUCCESS",
        subscription_id: sub.subscription_id,
        plan_id: sub.plan_id,
      };
    });
  }
}
