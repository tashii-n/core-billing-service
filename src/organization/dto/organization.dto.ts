import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '@prisma/client';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'did:example:123' })
  @IsNotEmpty()
  @IsString()
  org_did: string;

  @ApiProperty({ example: 'Acme Corp' })
  @IsNotEmpty()
  @IsString()
  org_name: string;

  @ApiProperty({ example: 'cognito-client-id-xyz' })
  @IsNotEmpty()
  @IsString()
  client_id: string;

  @ApiProperty({ example: 'CLIENT' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({ example: '/superadmin' })
  @IsNotEmpty()
  @IsString()
  redirect_url: string;

  @ApiProperty({ enum: OrgType, example: OrgType.SMALL })
  @IsNotEmpty()
  @IsEnum(OrgType)
  org_type: OrgType;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'did:example:123' })
  @IsOptional()
  @IsString()
  org_did?: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  org_name?: string;

  @ApiPropertyOptional({ example: 'cognito-client-id-xyz' })
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiPropertyOptional({ example: 'CLIENT' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'https://client.example.com/callback' })
  @IsOptional()
  @IsString()
  redirect_url?: string;

  @ApiPropertyOptional({ enum: OrgType, example: OrgType.MEDIUM })
  @IsOptional()
  @IsEnum(OrgType)
  org_type?: OrgType;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;
}
