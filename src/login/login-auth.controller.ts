import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginAuthService } from './login-auth.service';
import { ClientLoginDto } from './dto/client-login.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('LOGIN')
@Controller('auth')
export class LoginAuthController {
  constructor(private readonly authService: LoginAuthService) {}
  @ApiBearerAuth()
  @Post('login')
  @UseGuards(AuthGuard('jwt'))
  login(@Body() dto: ClientLoginDto) {
    return this.authService.login(dto);
  }
}
