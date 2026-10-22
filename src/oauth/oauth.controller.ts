import {
  Controller,
  Get,
  Inject,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import axios from 'axios';
import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import {
  CALLBACK_URL,
  WEB_REDIRECT_URI,
  accessTokenOptions,
  refreshTokenOptions,
  twoFATokenOptions,
} from '../utils/constants';
import { OAuthService, LoginResult } from './oauth.service';

@Controller('oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get('google')
  async googleAuth(@Res() res: Response) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const state = randomBytes(32).toString('base64url');

    await this.redis.set(`oauth:google:state:${state}`, '1', 'EX', 300);

    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
    url.searchParams.set('redirect_uri', CALLBACK_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    url.searchParams.set('state', state);

    return res.redirect(url.toString());
  }

  @Get('google/redirect')
  async googleAuthRedirect(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const savedState = state
      ? await this.redis.getdel(`oauth:google:state:${state}`)
      : null;

    if (savedState !== '1') {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const tokens = await this.exchangeCodeForTokens(code);

    const userInfo = await this.getGoogleUser(tokens.access_token);

    const result: LoginResult = await this.oauthService.fn(userInfo, req);

    const REDIRECT_URI = WEB_REDIRECT_URI;

    if ('_2fa_token' in result) {
      const redirectUrl = new URL(
        `${REDIRECT_URI}/two-factor-screen/?2fa=true&tempToken=${result._2fa_token}`,
      );
      res.cookie('2fa_token', result._2fa_token, twoFATokenOptions);
      return res.redirect(redirectUrl.toString());
    }

    const { access_token, refresh_token } = result;

    res.cookie('access_token', access_token, accessTokenOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenOptions);

    return res.redirect(REDIRECT_URI);
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
