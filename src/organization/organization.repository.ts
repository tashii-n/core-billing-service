// organization.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrgType } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
  constructor(private prisma: PrismaService) {}

  create(data: {
    org_did: string;
    client_id?: string;
    role?: string;
    redirect_url?: string;
    org_name: string;
    org_type: OrgType;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.prisma.organization.create({ data } as any);
  }

  update(
    org_id: string,
    data: {
      org_name?: string;
      client_id?: string;
      role?: string;
      redirect_url?: string;
      org_type?: OrgType;
    },
  ) {
    return this.prisma.organization.update({
      where: { org_id },
      data,
    });
  }

  findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany();
  }

  findOne(org_id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { org_id },
    });
  }

  findByDid(org_did: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { org_did } });
  }

  delete(org_id: string) {
    return this.prisma.organization.delete({ where: { org_id } });
  }
}
