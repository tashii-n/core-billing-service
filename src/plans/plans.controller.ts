import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plans.dto';

@ApiTags('PLANS')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a plan' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plans' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update plan by ID' })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan by ID' })
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}
