import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateUsageDto {
  @ApiProperty({ example: 'EKYC' })
  @IsString()
  @IsNotEmpty()
  serviceCode!: string;

  @ApiProperty({ example: 'SUCCESS', enum: ['SUCCESS', 'FAILED'] })
  @IsString()
  @IsIn(['SUCCESS', 'FAILED'])
  result!: 'SUCCESS' | 'FAILED';

  @ApiProperty({ example: 'thread-abc-123' })
  @IsString()
  @IsNotEmpty()
  threadId!: string;
}
