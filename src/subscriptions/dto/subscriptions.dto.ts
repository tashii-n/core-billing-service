import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNumberString,
  Min,
} from 'class-validator';
import { PricingSource, SubscriptionStatus } from '@prisma/client';

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

  /**
   * ---------- Prepaid terms (only if plan.billing_model === SUBSCRIPTION) ----------
   * TEMPLATE  => service pulls PlanPrice + PlanEntitlement.
   * NEGOTIATED => admin must send custom values.
   */

  @ApiPropertyOptional({ enum: PricingSource, description: 'For prepaid plans only' })
  @IsOptional()
  @IsEnum(PricingSource)
  pricing_source?: PricingSource;

  @ApiPropertyOptional({
    description: 'Currency code, default BTN. For prepaid negotiated terms only.',
    example: 'BTN',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Fixed fee for the prepaid subscription (NEGOTIATED). Send as string for decimals.',
    example: '1200.00',
  })
  @IsOptional()
  @IsNumberString()
  fixed_fee?: string;

  @ApiPropertyOptional({
    description: 'Included quota for prepaid subscription (NEGOTIATED).',
    example: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  included_quantity?: number;

  @ApiPropertyOptional({
    description: 'Optional overage unit price (NEGOTIATED). Send as string for decimals.',
    example: '0.2500',
  })
  @IsOptional()
  @IsNumberString()
  overage_unit_price?: string;
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
}
