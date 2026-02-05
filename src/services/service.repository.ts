// services.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Service } from '@prisma/client';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    service_name: string;
    service_code: string;
    org_type_eligible?: boolean;
  }): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  findAll(): Promise<Service[]> {
    return this.prisma.service.findMany();
  }

  findOne(service_id: number): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: { service_id },
    });
  }

  update(
    service_id: number,
    data: {
      service_name?: string;
      service_code: string;
      org_type_eligible?: boolean;
    },
  ): Promise<Service> {
    return this.prisma.service.update({
      where: { service_id },
      data,
    });
  }

  delete(service_id: number): Promise<Service> {
    return this.prisma.service.delete({
      where: { service_id },
    });
  }
}
