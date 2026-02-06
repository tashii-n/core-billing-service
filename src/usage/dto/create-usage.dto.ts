// src/usage/dto/create-usage.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { UsageResult } from '@prisma/client';

export class CreateUsageDto {
  @ApiProperty({ example: 'EKYC' })
  @IsNotEmpty()
  @IsString()
  serviceCode: string;

  @ApiProperty({ enum: UsageResult, example: UsageResult.SUCCESS })
  @IsEnum(UsageResult)
  result: UsageResult;

  @ApiProperty({
    description:
      'Idempotency key (thread/request id). Unique per subscription.',
    example: 'thread-12345',
  })
  @IsNotEmpty()
  @IsString()
  threadId: string;

  @ApiPropertyOptional({
    description:
      'Only allowed when caller is CORE (client_id == CORE_CLIENT_ID). Records usage for this org DID.',
    example: 'did:example:org-abc',
  })
  @IsOptional()
  @IsString()
  orgDid?: string;

  @ApiPropertyOptional({
    description:
      'Optional metadata for audit/debug (stored as JSON in usage_events.metadata).',
    example: { requestId: 'req_001', journey: 'kyc', vendor: 'didit' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
