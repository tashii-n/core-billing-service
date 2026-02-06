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
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
} from './dto/subscriptions.dto';

@ApiTags('SUBSCRIPTIONS')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({
    type: CreateSubscriptionDto,
    examples: {
      prepaidTemplate: {
        summary: 'Prepaid - TEMPLATE pricing (recommended default)',
        value: {
          org_id: 1,
          service_id: 1,
          plan_id: 10,
          status: 'ACTIVE',
          pricing_source: 'TEMPLATE',
          start_date: '2026-02-06T00:00:00.000Z',
          // end_date optional: if not provided, service auto-calculates from plan.billing_period
          cancel_at_period_end: false,
        },
      },
      prepaidNegotiated: {
        summary: 'Prepaid - NEGOTIATED pricing (custom deal)',
        value: {
          org_id: 1,
          service_id: 1,
          plan_id: 10,
          status: 'ACTIVE',
          pricing_source: 'NEGOTIATED',
          currency: 'BTN',
          fixed_fee: '2500.00',
          included_quantity: 5000,
          overage_unit_price: '0.2500',
          start_date: '2026-02-06T00:00:00.000Z',
          cancel_at_period_end: false,
        },
      },
      postpaidPayPerUse: {
        summary: 'Postpaid - PAY_PER_USE (no prepaid terms allowed)',
        value: {
          org_id: 1,
          service_id: 2,
          plan_id: 99,
          status: 'ACTIVE',
          start_date: '2026-02-06T00:00:00.000Z',
          // DO NOT send pricing_source/fixed_fee/included_quantity for PAY_PER_USE
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'subscription created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'subscription updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'subscriptions retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'subscription retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({
    status: 200,
    description: 'subscription deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
