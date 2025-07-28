import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { Response } from 'express';
import { Platform } from '../decorators/platform.decorator';
import { MOBILE_REDIRECT_URI, WEB_REDIRECT_URI } from '../utils/constants';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) {}
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirect to Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req,
    @Res() res: Response,
    @Platform() platform: 'web' | 'mobile',
  ) {
    const tokens = await this.oauthService.fn(req.user);

    const REDIRECT_URI =
      platform === 'web' ? WEB_REDIRECT_URI : MOBILE_REDIRECT_URI;

    const redirectUrl = new URL(REDIRECT_URI);
    redirectUrl.searchParams.set('access', tokens.access_token);
    redirectUrl.searchParams.set('refresh', tokens.refresh_token);

    return res.redirect(redirectUrl.toString());
  }
}
