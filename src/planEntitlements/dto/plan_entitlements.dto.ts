import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePlanEntitlementDto {
  @ApiProperty({ example: 1, description: 'Plan ID (foreign key)' })
  @IsInt()
  @IsNotEmpty()
  plan_id: number;

  @ApiPropertyOptional({ enum: OrgType, example: OrgType.OTHER })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;

  @ApiProperty({ example: 1000 })
  @IsInt()
  included_quantity: number;

  @ApiPropertyOptional({ example: 0.025 })
  @IsOptional()
  overage_unit_price?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  hard_limit?: boolean;

  @ApiProperty({ example: 'PER_BILLING_CYCLE' })
  @IsString()
  period: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class UpdatePlanEntitlementDto {
  @ApiPropertyOptional({ enum: OrgType })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsInt()
  included_quantity?: number;

  @ApiPropertyOptional({ example: 0.03 })
  @IsOptional()
  overage_unit_price?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hard_limit?: boolean;

  @ApiPropertyOptional({ example: 'PER_BILLING_CYCLE' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
