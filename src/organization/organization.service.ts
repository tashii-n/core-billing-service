// organization.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async create(dto: CreateOrganizationDto) {
    const {
      org_did,
      orgId,
      org_name,
      org_type,
      client_id,
      role,
      redirect_url,
    } = dto;
    if (!org_type) {
      throw new BadRequestException('org_type is required');
    }
    if (orgId) {
      const existingOrg = await this.repository.findByOrgId(orgId);
      if (existingOrg) {
        throw new BadRequestException('orgId already exists');
      }
    }
    return this.repository.create({
      org_did,
      orgId,
      org_name,
      org_type,
      client_id,
      role,
      redirect_url,
    });
  }

  async update(org_id: number, dto: UpdateOrganizationDto) {
    const org = await this.repository.findOne(org_id);
    if (!org) throw new NotFoundException('Organization not found');

    const updateData: any = {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.org_name !== undefined) updateData.org_name = dto.org_name;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    if (dto.orgId !== undefined) updateData.orgId = dto.orgId;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.org_type !== undefined) updateData.org_type = dto.org_type;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.client_id !== undefined) updateData.client_id = dto.client_id;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.redirect_url !== undefined)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      updateData.redirect_url = dto.redirect_url;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.repository.update(org_id, updateData);
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(org_id: number) {
    const org = await this.repository.findOne(org_id);
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async delete(org_id: number) {
    const org = await this.repository.findOne(org_id);
    if (!org) throw new NotFoundException('Organization not found');
    return this.repository.delete(org_id);
  }
}
