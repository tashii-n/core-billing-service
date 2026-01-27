import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreatePlanUsageRateDto {
  @ApiProperty({ example: 1, description: 'Plan ID (foreign key)' })
  @IsInt()
  @IsNotEmpty()
  plan_id: number;

  @ApiProperty({ example: 0.015 })
  @IsNumber()
  unit_price: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  @IsDateString()
  effective_from: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}

export class UpdatePlanUsageRateDto {
  @ApiPropertyOptional({ example: 0.02 })
  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
