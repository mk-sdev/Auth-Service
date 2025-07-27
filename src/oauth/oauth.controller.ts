import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // przekierowanie do Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    // await this.oauthService(req.user);
    console.log(req.user);
    return req.user; // tutaj masz dane użytkownika
  }
}
