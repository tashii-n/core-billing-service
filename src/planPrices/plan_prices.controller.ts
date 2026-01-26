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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PlanPricesService } from './plan_prices.service';
import { CreatePlanPriceDto, UpdatePlanPriceDto } from './dto/plan_prices.dto';

@ApiTags('PLAN_PRICES')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('plan-prices')
export class PlanPricesController {
  constructor(private readonly service: PlanPricesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new plan price' })
  @ApiResponse({ status: 201, description: 'Plan price created successfully' })
  create(@Body() dto: CreatePlanPriceDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plan prices' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan price by ID' })
  @ApiResponse({ status: 404, description: 'Plan price not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update plan price by ID' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlanPriceDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete plan price by ID' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
