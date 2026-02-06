import {
  BadRequestException,
  Injectable,
  NotFoundException,
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
    const { org_did, org_name, org_type, client_id, role, redirect_url } = dto;

    if (!org_type) throw new BadRequestException('org_type is required');

    return this.repository.create({
      org_did,
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

    return this.repository.update(org_id, {
      org_did: dto.org_did,
      org_name: dto.org_name,
      org_type: dto.org_type,
      client_id: dto.client_id,
      role: dto.role,
      redirect_url: dto.redirect_url,
      is_active: dto.is_active,
    });
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
