// services.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Services } from '@prisma/client';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    services_name: string;
    org_type_eligible?: boolean;
  }): Promise<Services> {
    return this.prisma.services.create({ data });
  }

  findAll(): Promise<Services[]> {
    return this.prisma.services.findMany();
  }

  findOne(services_id: number): Promise<Services | null> {
    return this.prisma.services.findUnique({
      where: { services_id },
    });
  }

  update(
    services_id: number,
    data: {
      services_name?: string;
      org_type_eligible?: boolean;
    },
  ): Promise<Services> {
    return this.prisma.services.update({
      where: { services_id },
      data,
    });
  }

  delete(services_id: number): Promise<Services> {
    return this.prisma.services.delete({
      where: { services_id },
    });
  }
}
