import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class CreatePlanPriceDto {
  @ApiProperty({ example: 1, description: 'Plan ID (foreign key)' })
  @IsNotEmpty()
  plan_id: number;

  @ApiPropertyOptional({ enum: OrgType, example: OrgType.OTHER })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;

  @ApiPropertyOptional({ example: 'BTN', description: 'Currency' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 1200.5 })
  @IsNotEmpty()
  @IsNumber()
  fixed_fee: number;

  @ApiProperty({ example: '2026-01-26T00:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class UpdatePlanPriceDto {
  @ApiPropertyOptional({ enum: OrgType })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;

  @ApiPropertyOptional({ example: 'BTN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 1500.75 })
  @IsOptional()
  @IsNumber()
  fixed_fee?: number;

  @ApiPropertyOptional({ example: '2026-01-26T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
