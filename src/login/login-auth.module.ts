import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoginAuthController } from '../login/login-auth.controller';
import { LoginAuthService } from '../login/login-auth.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthConfig } from '../auth/auth.config';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PrismaModule,
  ],
  controllers: [LoginAuthController],
  providers: [LoginAuthService, JwtStrategy, AuthConfig],
})
export class LoginAuthModule {}
