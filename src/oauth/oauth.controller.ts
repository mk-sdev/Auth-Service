import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { Response } from 'express';

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
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const tokens = await this.oauthService.fn(req.user);

    const redirectUrl = new URL('http://localhost:8081/oauth-callback');
    redirectUrl.searchParams.set('access', tokens.access_token);
    redirectUrl.searchParams.set('refresh', tokens.refresh_token);

    return res.redirect(redirectUrl.toString());
  }
}
