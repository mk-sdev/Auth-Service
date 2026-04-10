import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import axios from 'axios';
import {
  CALLBACK_URL,
  MOBILE_REDIRECT_URI,
  WEB_REDIRECT_URI,
  accessTokenOptions,
  refreshTokenOptions,
} from '../utils/constants';
import { OAuthService, LoginResult } from './oauth.service';
import { Platform } from '../decorators/platform.decorator';

@Controller('oauth')
export class OAuthController {
  constructor(private readonly oauthService: OAuthService) { }

  @Get('google')
  async googleAuth(@Res() res: Response) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');

    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    url.searchParams.set('redirect_uri', CALLBACK_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return res.redirect(url.toString());
  }

  @Get('google/redirect')
  async googleAuthRedirect(
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
    @Platform() platform: 'web' | 'mobile',
    @Req() req: Request,
  ) {
    const tokens = await this.exchangeCodeForTokens(code);

    const userInfo = await this.getGoogleUser(tokens.access_token);

    const result: LoginResult = await this.oauthService.fn(userInfo, req);

    const REDIRECT_URI =
      platform === 'web' ? WEB_REDIRECT_URI : MOBILE_REDIRECT_URI;

    if ('requires2FA' in result) {
      const redirectUrl = new URL(
        `${REDIRECT_URI}?2fa=true&tempToken=${result.tempToken}`,
      );
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

  private async exchangeCodeForTokens(code: string) {
    const res = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: CALLBACK_URL,
      grant_type: 'authorization_code',
    });

    return res.data as {
      access_token: string;
      id_token: string;
      refresh_token?: string;
      expires_in: number;
    };
  }

  private async getGoogleUser(accessToken: string) {
    const res = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    return {
      email: res.data.email,
      emailVerified: res.data.verified_email,
    };
  }
}