import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateUsageDto {
  @ApiProperty({ example: 'did:org:test-001' })
  @IsString()
  @IsNotEmpty()
  orgDid!: string;

  @ApiProperty({
    example: 'EKYC',
    description: 'Unique service code',
  })
  @IsString()
  @IsNotEmpty()
  serviceCode!: string;

  @ApiProperty({
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAILED'],
  })
  @IsIn(['SUCCESS', 'FAILED'])
  result!: 'SUCCESS' | 'FAILED';

  @ApiProperty({
    example: 'thread-abc-123',
    description: 'Idempotency key',
  })
  @IsString()
  @IsNotEmpty()
  threadId!: string;
}
