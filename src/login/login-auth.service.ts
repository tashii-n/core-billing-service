import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientLoginDto } from './dto/client-login.dto';
import { PrismaService } from '../../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class LoginAuthService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async login(dto: ClientLoginDto) {
    const clientId = dto.client_id;

    // Log client credentials for debugging
    console.log('Attempting login with:');
    console.log('Client ID:', clientId);
    console.log('Client Secret:', dto.client_secret);

    try {
      // Fetch client from database using client_id
      const organization = await this.prisma.organization.findFirst({
        where: { client_id: clientId },
      });

      // Check if client exists in database
      if (!organization) {
        console.log('Client ID not found in database');
        throw new UnauthorizedException('Client ID does not exist');
      }

      // No client_id/client_secret exists on the returned organization record; ensure a client_secret was provided
      // and rely on the external auth endpoint to validate credentials.
      if (!dto.client_secret) {
        console.log('Missing client secret');
        throw new UnauthorizedException(
          'Client ID or Client Secret is incorrect',
        );
      }

      // Check if organization is active
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!(organization as any).is_active) {
        console.log('Organization is inactive');
        throw new UnauthorizedException('Organization is inactive');
      }

      // Call external authentication endpoint
      const response = await axios.post(
        this.configService.get('AUTH_ENDPOINT'),
        {
          client_id: clientId,
          client_secret: dto.client_secret,
        },
      );

      console.log('Token generated successfully');
      console.log('Response:', response.data);

      // Determine if this is a super admin login
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const role = (organization as any).role ?? 'user';
      const isSuperAdmin = role === 'superadmin';

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        access_token: response.data.access_token,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        expires_in: response.data.expires_in,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: role,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        redirect_url: (organization as any).redirect_url,
        org_id: organization.org_id,
        org_name: organization.org_name,
        is_super_admin: isSuperAdmin,
      };
    } catch (error) {
      console.log('Token generation failed');
      console.log('Error:', error);
      throw new UnauthorizedException(
        'Client ID or Client Secret is incorrect',
      );
    }
  }
}
