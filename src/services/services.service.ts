// services.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ServicesRepository } from './service.repository';
import { CreateServiceDto, UpdateServiceDto } from './dto/services.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly repository: ServicesRepository) {}

  create(dto: CreateServiceDto) {
    return this.repository.create(dto);
  }

  findAll() {
    return this.repository.findAll();
  }

  async findOne(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const service = await this.repository.findOne(id);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return service;
  }

  async update(id: number, dto: UpdateServiceDto) {
    await this.findOne(id); // existence check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.repository.update(id, dto);
  }

  async delete(id: number) {
    await this.findOne(id); // existence check
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.repository.delete(id);
  }
}
