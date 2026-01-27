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
import { AuthGuard } from '@nestjs/passport';
import { PlanUsageRateService } from './plan_usage_rate.service';
import {
  CreatePlanUsageRateDto,
  UpdatePlanUsageRateDto,
} from './dto/plan_usage_rate.dto';

@ApiTags('PLAN_USAGE_RATES')
@ApiBearerAuth()
@Controller('plan-usage-rates')
export class PlanUsageRateController {
  constructor(private readonly service: PlanUsageRateService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 201,
    description: 'plan usage rate record created successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  create(@Body() dto: CreatePlanUsageRateDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'plan usage rate record updated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanUsageRateDto,
  ) {
    return this.service.update(id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'plan usage rate records retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'plan usage rate record retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'plan usage rate record deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
