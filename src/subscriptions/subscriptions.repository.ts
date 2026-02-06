import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.subscription.create({
      data,
      include: {
        organization: true,
        service: true,
        plan: true,
        subscription_prepaid_term: true,
      },
    });
  }

  findAll() {
    return this.prisma.subscription.findMany({
      include: {
        organization: true,
        service: true,
        plan: true,
        subscription_prepaid_term: true,
      },
    });
  }

  findOne(subscription_id: number) {
    return this.prisma.subscription.findUnique({
      where: { subscription_id },
      include: {
        organization: true,
        service: true,
        plan: true,
        subscription_prepaid_term: true,
      },
    });
  }

  update(subscription_id: number, data: any) {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.subscription.update({
      where: { subscription_id },
      data: cleaned,
      include: {
        organization: true,
        service: true,
        plan: true,
        subscription_prepaid_term: true,
      },
    });
  }

  delete(subscription_id: number) {
    return this.prisma.subscription.delete({
      where: { subscription_id },
    });
  }
}
