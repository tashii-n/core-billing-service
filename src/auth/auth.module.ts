import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthConfig } from './auth.config';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [],
  providers: [AuthConfig, JwtStrategy],
})
export class AuthModule {}
