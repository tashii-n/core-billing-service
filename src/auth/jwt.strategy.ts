import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { AuthConfig } from './auth.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(authConfig: AuthConfig) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${authConfig.authority}/.well-known/jwks.json`,
      }),

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: authConfig.authority,
      algorithms: ['RS256'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async validate(payload: any): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return payload;
  }
}
