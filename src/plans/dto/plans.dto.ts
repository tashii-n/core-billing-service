import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingModel, PlanCode } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 1, description: 'Service ID (foreign key)' })
  @IsNotEmpty()
  service_id: number;

  @ApiProperty({ enum: PlanCode, example: PlanCode.BASIC })
  @IsEnum(PlanCode)
  plan_code: PlanCode;

  @ApiProperty({ example: 'MONTHLY' })
  @IsString()
  billing_period: string;

  @ApiProperty({ enum: BillingModel })
  @IsEnum(BillingModel)
  billing_model: BillingModel;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatePlanDto {
  @ApiPropertyOptional({ enum: PlanCode })
  @IsOptional()
  @IsEnum(PlanCode)
  plan_code?: PlanCode;

  @ApiPropertyOptional({ example: 'YEARLY' })
  @IsOptional()
  @IsString()
  billing_period?: string;

  @ApiPropertyOptional({ enum: BillingModel })
  @IsOptional()
  @IsEnum(BillingModel)
  billing_model?: BillingModel;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
