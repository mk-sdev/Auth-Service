import { Controller, Get, Patch, Query, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Id } from 'src/decorators/id.decorator';
import { accessTokenOptions, refreshTokenOptions } from 'src/utils/constants';
import { JwtGuard } from '../guards/jwt.guard';
import { TwoFactorService } from './2fa.service';

@Controller('2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) { }

  @Patch('enable')
  @UseGuards(JwtGuard)
  async enable(@Id() userId: string) {
    return this.twoFactorService.enableTwoFactor(userId);
  }

  @Patch('disable')
  @UseGuards(JwtGuard)
  async disable(@Id() userId: string) {
    return this.twoFactorService.disableTwoFactor(userId);
  }

  @Get('is-enabled')
  @UseGuards(JwtGuard)
  async isEnabled(@Id() userId: string) {
    return this.twoFactorService.isTwoFactorEnabled(userId);
  }

  @Patch('generate')
  async generate(@Id() userId: string) {
    return this.twoFactorService.generateOtp(userId);
  }

  @Patch('verify')
  async verify(
    @Req() req,
    @Res({ passthrough: true }) res: Response,
    @Query('otp') otp: string,
  ) {
    console.log("otp:", otp);

    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('Authorization header missing');

    const tempToken = authHeader.split(' ')[1]; // Bearer <tempToken>
    if (!tempToken) throw new UnauthorizedException('Token is required');

    const { access_token, refresh_token } = await this.twoFactorService.verifyOtp(tempToken, otp);

    res.cookie('access_token', access_token, accessTokenOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenOptions);

    return { message: '2FA successful' };
  }
}