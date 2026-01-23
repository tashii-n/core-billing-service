import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto/organization.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('ORGANIZATIONS')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'organization record created successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'update organization record created successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.service.update(id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'organization record retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: 'organization record delete successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @UseGuards(AuthGuard('jwt'))
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
