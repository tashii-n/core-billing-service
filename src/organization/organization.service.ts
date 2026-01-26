// organization.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async create(dto: CreateOrganizationDto) {
    const { org_did, org_name, org_type } = dto;
    if (!org_type) {
      throw new Error('org_type is required');
    }
    return this.repository.create({ org_did, org_name, org_type });
  }

  async update(org_id: number, dto: UpdateOrganizationDto) {
    const org = await this.repository.findOne(org_id);
    if (!org) throw new NotFoundException('Organization not found');
    return this.repository.update(org_id, dto);
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
