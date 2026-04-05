import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService, LoginResult } from './oauth.service';
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
  constructor(private readonly oauthService: OAuthService) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // redirect handled by passport
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Platform() platform: 'web' | 'mobile',
  ) {
    const result: LoginResult = await this.oauthService.fn(req.user, req);

    const REDIRECT_URI =
      platform === 'web' ? WEB_REDIRECT_URI : MOBILE_REDIRECT_URI;

    if ('requires2FA' in result) {
      const redirectUrl = new URL(REDIRECT_URI+'?2fa=true&tempToken='+result.tempToken);
      return res.redirect(redirectUrl.toString());
    }

    const { access_token, refresh_token } = result;

    if (platform === 'web') {
      res.cookie('access_token', access_token, accessTokenOptions);
      res.cookie('refresh_token', refresh_token, refreshTokenOptions);

      return res.redirect(REDIRECT_URI);
    }

    return {
      message: 'Login successful',
      access_token,
      refresh_token,
    };
  }
}