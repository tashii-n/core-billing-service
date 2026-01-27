import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';
import { SubscriptionStatus } from '@prisma/client';

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsInt()
  org_id: number;

  @ApiProperty()
  @IsInt()
  service_id: number;

  @ApiProperty()
  @IsInt()
  plan_id: number;

  @ApiProperty({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancel_at_period_end?: boolean;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  cancel_at_period_end?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  current_period_start?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  current_period_end?: string;
}
