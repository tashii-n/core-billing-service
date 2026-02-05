import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsageService } from './usage.service';
import { CreateUsageDto } from './dto/create-usage.dto';

@ApiTags('Usage')
@ApiBearerAuth() // 🔐 Shows Authorization header in Swagger
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
    schema: {
      example: {
        status: 'DUPLICATE',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid token',
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription for this service',
  })
  async create(@Body() dto: CreateUsageDto, @Req() req: any) {
    const clientId = req.user?.client_id; // from Cognito access token
    return this.usageService.createUsage(dto, clientId);
  }
}
