// src/usage/usage.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsageService } from './usage.service';
import { CreateUsageDto } from './dto/create-usage.dto';

@ApiTags('USAGE')
@ApiBearerAuth()
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  /**
   * POST /usage
   * Records a usage event + increments UsageCounter for SUCCESS only.
   * Org is resolved by:
   * - normal caller: JWT client_id -> Organization.client_id
   * - CORE caller (client_id == CORE_CLIENT_ID): dto.orgDid -> Organization.org_did
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({
    description: 'Usage event payload',
    examples: {
      normalClient: {
        summary: 'Normal client usage (non-core)',
        value: {
          serviceCode: 'EKYC',
          threadId: 'req-123456',
          result: 'SUCCESS',
          metadata: {
            documentType: 'PASSPORT',
            country: 'BT',
          },
        },
      },
      coreClient: {
        summary: 'CORE client usage (acting on behalf of an org)',
        value: {
          serviceCode: 'EKYC',
          threadId: 'req-789012',
          result: 'SUCCESS',
          orgDid: 'did:example:org123',
          metadata: {
            flow: 'bulk-verification',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usage recorded.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(@Body() dto: CreateUsageDto, @Req() req: any) {
    const clientId =
      req.user?.client_id ?? req.user?.aud ?? req.user?.azp ?? undefined;

    return this.usageService.createUsage(dto, clientId);
  }

  /**
   * GET /usage/check?serviceCode=EKYC[&orgDid=did:...]
   * Checks if org has ACTIVE subscription, within term, and for prepaid: quota not exceeded.
   * PAY_PER_USE: no quota check.
   */
  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  @ApiQuery({
    name: 'serviceCode',
    required: true,
    description: 'Service code to check access for',
    example: 'EKYC',
  })
  @ApiQuery({
    name: 'orgDid',
    required: false,
    description:
      'Only for CORE caller (client_id == CORE_CLIENT_ID). If provided, checks access for that org DID.',
    example: 'did:example:org123',
  })
  @ApiResponse({
    status: 200,
    description: 'Access check result.',
    content: {
      'application/json': {
        examples: {
          prepaidOk: {
            summary: 'Prepaid subscription – access allowed',
            value: {
              eligible: true,
              reason: 'OK',
              used: 120,
              limit: 1000,
              remaining: 880,
            },
          },
          quotaExceeded: {
            summary: 'Prepaid subscription – quota exceeded',
            value: {
              eligible: false,
              reason: 'QUOTA_EXCEEDED',
              used: 1000,
              limit: 1000,
              remaining: 0,
            },
          },
          payPerUse: {
            summary: 'Pay-per-use subscription',
            value: {
              eligible: true,
              reason: 'OK',
              billing_model: 'PAY_PER_USE',
            },
          },
          noSubscription: {
            summary: 'No active subscription',
            value: {
              eligible: false,
              reason: 'NO_ACTIVE_SUBSCRIPTION',
            },
          },
        },
      },
    },
  })
  check(
    @Query('serviceCode') serviceCode: string,
    @Query('orgDid') orgDid: string | undefined,
    @Req() req: any,
  ) {
    const clientId =
      req.user?.client_id ?? req.user?.aud ?? req.user?.azp ?? undefined;

    return this.usageService.checkAccess(serviceCode, clientId, orgDid);
  }
}
