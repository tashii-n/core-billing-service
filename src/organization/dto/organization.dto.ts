import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  org_did: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  org_name: string;

  @ApiPropertyOptional({ enum: OrgType })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  org_name?: string;

  @ApiPropertyOptional({ enum: OrgType })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;
}
