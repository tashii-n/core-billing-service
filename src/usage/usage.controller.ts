import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UsageService } from "./usage.service";
import { CreateUsageDto } from "./dto/create-usage.dto";

@ApiTags("Usage")
@Controller("usage")
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post()
  @ApiOperation({ summary: "Record usage for a subscription" })
  @ApiBody({ type: CreateUsageDto })
  @ApiResponse({
    status: 201,
    description: "Usage recorded successfully",
    schema: {
      example: {
        status: "RECORDED",
        counted: true,
        subscription_id: 12,
        plan_id: 3,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Duplicate usage (already recorded)",
    schema: {
      example: {
        status: "DUPLICATE",
      },
    },
  })
  recordUsage(@Body() dto: CreateUsageDto) {
    return this.usageService.createUsage(dto);
  }
}
