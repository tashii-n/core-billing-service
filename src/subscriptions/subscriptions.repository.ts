import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.subscription.create({ data });
  }

  findAll() {
    return this.prisma.subscription.findMany({
      include: {
        organization: true,
        service: true,
        plan: true,
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
      },
    });
  }

  update(subscription_id: number, data: any) {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    return this.prisma.subscription.update({
      where: { subscription_id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: cleaned,
    });
  }

  delete(subscription_id: number) {
    return this.prisma.subscription.delete({
      where: { subscription_id },
    });
  }
}
