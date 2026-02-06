import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrgType } from '@prisma/client';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    orgId: string;        // string business id
    org_did: string;      // did
    org_name: string;
    org_type: OrgType;

    client_id: string;
    role: string;
    redirect_url: string;

    is_active?: boolean;
  }): Promise<Organization> {
    return this.prisma.organization.create({
      data: {
        orgId: data.orgId,
        org_did: data.org_did,
        org_name: data.org_name,
        org_type: data.org_type,
        client_id: data.client_id,
        role: data.role,
        redirect_url: data.redirect_url,
        is_active: data.is_active ?? true,
      },
    });
  }

  update(
    org_id: number, // org_id is Int PK
    data: Partial<{
      orgId: string;
      org_did: string;
      org_name: string;
      org_type: OrgType;
      client_id: string;
      role: string;
      redirect_url: string;
      is_active: boolean;
    }>,
  ): Promise<Organization> {
    return this.prisma.organization.update({
      where: { org_id },
      data,
    });
  }

  findAll(): Promise<Organization[]> {
    return this.prisma.organization.findMany();
  }

  findOne(org_id: number): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { org_id },
    });
  }

  // lookup by string business id
  findByOrgId(orgId: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { orgId },
    });
  }

  findByDid(org_did: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { org_did },
    });
  }

  findByClientId(client_id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { client_id },
    });
  }

  delete(org_id: number): Promise<Organization> {
    return this.prisma.organization.delete({
      where: { org_id },
    });
  }
}
