import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  me(@Req() req: any) {
    return {
      client_id: req.user.client_id,
      token_use: req.user.token_use,
      sub: req.user.sub,
    };
  }
}
