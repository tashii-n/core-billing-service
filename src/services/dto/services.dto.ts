// services.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({ example: 'Mobile verifier ' })
  @IsNotEmpty()
  @IsString()
  service_name: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  org_type_eligible?: boolean;
}

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'Updated NDI Service' })
  @IsOptional()
  @IsString()
  service_name?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  org_type_eligible?: boolean;
}
