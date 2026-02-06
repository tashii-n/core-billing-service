import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { CreateUsageDto } from './dto/create-usage.dto';

@ApiTags('Usage')
@ApiBearerAuth()
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Record a usage event (authenticated org only)',
  })
  @ApiBody({
    type: CreateUsageDto,
    examples: {
      success: {
        summary: 'SUCCESS usage',
        value: {
          serviceCode: 'EKYC',
          result: 'SUCCESS',
          threadId: 'thread-1001',
        },
      },
      failure: {
        summary: 'FAILED usage',
        value: {
          serviceCode: 'EKYC',
          result: 'FAILED',
          threadId: 'thread-1002',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Recorded',
    schema: {
      example: {
        status: 'RECORDED',
        counted: true,
        subscription_id: 10,
        plan_id: 2,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate (same threadId already recorded)',
    schema: { example: { status: 'DUPLICATE' } },
  })
  async create(@Body() dto: CreateUsageDto, @Req() req: any) {
    const clientId = req.user?.client_id;
    return this.usageService.createUsage(dto, clientId);
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Check if org can use a service now',
    description:
      'Validates ACTIVE subscription and term dates. Enforces hard quota only for prepaid plans. PAY_PER_USE has no quota.',
  })
  @ApiQuery({ name: 'serviceCode', required: true, example: 'EKYC' })
  @ApiResponse({
    status: 200,
    description: 'Eligibility result',
    schema: {
      examples: {
        prepaidOk: {
          summary: 'Prepaid allowed',
          value: {
            eligible: true,
            reason: 'OK',
            billing_model: 'SUBSCRIPTION',
            subscription_id: 10,
            plan_id: 2,
            used: 4,
            limit: 100,
            remaining: 96,
          },
        },
        paygOk: {
          summary: 'PAY_PER_USE allowed',
          value: {
            eligible: true,
            reason: 'OK',
            billing_model: 'PAY_PER_USE',
            subscription_id: 11,
            plan_id: 5,
          },
        },
        exceeded: {
          summary: 'Prepaid quota exceeded',
          value: {
            eligible: false,
            reason: 'QUOTA_EXCEEDED',
            billing_model: 'SUBSCRIPTION',
            subscription_id: 10,
            plan_id: 2,
            used: 100,
            limit: 100,
            remaining: 0,
          },
        },
      },
    },
  })
  async check(@Query('serviceCode') serviceCode: string, @Req() req: any) {
    const clientId = req.user?.client_id;
    return this.usageService.checkAccess(serviceCode, clientId);
  }
}
