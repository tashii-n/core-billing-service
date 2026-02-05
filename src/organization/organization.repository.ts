// organization.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrgType } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
  constructor(private prisma: PrismaService) {}

  create(data: {
    org_did: string;
    orgId: string;
    client_id: string;
    role: string;
    redirect_url: string;
    org_name: string;
    org_type: OrgType;
  }) {
    return this.prisma.organization.create({ data });
  }

  update(
    org_id: number,
    data: {
      org_name?: string;
      client_id: string;
      role: string;
      redirect_url: string;
      org_type?: OrgType;
      orgId?: string;
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

  findOne(org_id: number): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { org_id } });
  }

  findByDid(org_did: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({ where: { org_did } });
  }

  findByOrgId(orgId: string): Promise<Organization | null> {
    return this.prisma.organization.findFirst({ where: { orgId: orgId } });
  }

  delete(org_id: number) {
    return this.prisma.organization.delete({ where: { org_id } });
  }
}
