import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { Response } from 'express';
import { Platform } from '../decorators/platform.decorator';
import {
  accessTokenOptions,
  MOBILE_REDIRECT_URI,
  refreshTokenOptions,
  WEB_REDIRECT_URI,
} from '../utils/constants';

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
    @Res({ passthrough: true }) res: Response,
    @Platform() platform: 'web' | 'mobile',
  ) {
    const tokens = await this.oauthService.fn(req.user, req);

    const REDIRECT_URI =
      platform === 'web' ? WEB_REDIRECT_URI : MOBILE_REDIRECT_URI;

    if (platform === 'web') {
      res.cookie('access_token', tokens.access_token, accessTokenOptions);
      res.cookie('refresh_token', tokens.refresh_token, refreshTokenOptions);
      const redirectUrl = new URL(REDIRECT_URI);
      return res.redirect(redirectUrl.toString());
    }
    return { message: 'Login successful' };

    // redirectUrl.searchParams.set('access', tokens.access_token);
    // redirectUrl.searchParams.set('refresh', tokens.refresh_token);
  }
}
