import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBody,
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
    summary: 'Record usage for the authenticated organization',
    description:
      'Adds a usage event and increments usage counter (SUCCESS only). ' +
      'Organization is resolved from the access token client_id.',
  })
  @ApiBody({
    type: CreateUsageDto,
    examples: {
      successUsage: {
        summary: 'Successful usage',
        value: {
          serviceCode: 'EKYC',
          result: 'SUCCESS',
          threadId: 'thread-12345',
        },
      },
      failedUsage: {
        summary: 'Failed usage',
        value: {
          serviceCode: 'EKYC',
          result: 'FAILED',
          threadId: 'thread-12346',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usage recorded successfully',
    schema: {
      example: {
        status: 'RECORDED',
        counted: true,
        subscription_id: 42,
        plan_id: 3,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Duplicate usage (same threadId already recorded)',
    schema: { example: { status: 'DUPLICATE' } },
  })
  async create(@Body() dto: CreateUsageDto, @Req() req: any) {
    const clientId = req.user?.client_id;
    return this.usageService.createUsage(dto, clientId);
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Check if the authenticated org can use a service now',
    description:
      'Validates ACTIVE subscription + billing period window. ' +
      'Quota is enforced only for prepaid (billing_model=SUBSCRIPTION). ' +
      'PAY_PER_USE has no quota checks.',
  })
  @ApiQuery({ name: 'serviceCode', required: true, example: 'EKYC' })
  @ApiResponse({
    status: 200,
    description: 'Eligibility result',
    schema: {
      examples: {
        prepaidOk: {
          summary: 'Prepaid allowed (within quota)',
          value: {
            eligible: true,
            reason: 'OK',
            billing_model: 'SUBSCRIPTION',
            subscription_id: 55,
            plan_id: 2,
            periodStart: '2026-02-01T00:00:00.000Z',
            periodEnd: '2027-02-01T00:00:00.000Z',
            used: 12,
            limit: 100,
            remaining: 88,
          },
        },
        prepaidExceeded: {
          summary: 'Prepaid blocked (quota exceeded)',
          value: {
            eligible: false,
            reason: 'QUOTA_EXCEEDED',
            billing_model: 'SUBSCRIPTION',
            subscription_id: 55,
            plan_id: 2,
            used: 100,
            limit: 100,
            remaining: 0,
          },
        },
        paygOk: {
          summary: 'Pay-per-use allowed (no quotas)',
          value: {
            eligible: true,
            reason: 'OK',
            billing_model: 'PAY_PER_USE',
            subscription_id: 77,
            plan_id: 9,
            periodStart: '2026-02-01T00:00:00.000Z',
            periodEnd: '2027-02-01T00:00:00.000Z',
          },
        },
        noSub: {
          summary: 'No active subscription',
          value: {
            eligible: false,
            reason: 'NO_ACTIVE_SUBSCRIPTION',
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
