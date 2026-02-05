import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClientLoginDto {
  @ApiProperty({
    description: 'Client ID registered in the system',
    example: 'clientid',
  })
  @IsString()
  client_id: string;

  @ApiProperty({
    description: 'Client secret provided by AWS Cognito',
    example: 'clientsecret',
  })
  @IsString()
  client_secret: string;
}
