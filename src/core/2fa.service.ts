import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { HashService } from 'src/utils/hash/hash.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { MailService } from './mail.service';
import { JwtPayload } from 'src/utils/interfaces';
import Redis from 'ioredis';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly userRepo: UserCrudRepoService,
    private readonly mailService: MailService,
    private readonly hashService: HashService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    @Inject('2FA_TOKEN_SERVICE')
    private readonly tempTokenService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) { }

  async enableTwoFactor(userId: string) {
    await this.userRepo.enableTwoFactor(userId);
    return { message: '2FA enabled' };
  }

  async disableTwoFactor(userId: string) {
    await this.userRepo.disableTwoFactor(userId);
    return { message: '2FA disabled' };
  }

  async isTwoFactorEnabled(userId: string) {
    const isEnabled = await this.userRepo.isTwoFactorEnabled(userId);
    return { isEnabled };
  }

  async generateOtp(userId: string) {
    const otp = crypto.randomInt(100000, 999999).toString();

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const hashedOtp = await this.hashService.hash(otp);

    await this.userRepo.setTwoFactorOtp(userId, hashedOtp, expiresAt);

    await this.mailService.send2faCode(userId, otp); // plain tylko w mailu

    return { message: 'OTP generated and sent via email' };
  }

  async verifyOtp(tempToken: string, otp: string) {
    const key = `2fa_attempts:${tempToken}`;
    const ttlSeconds = 60 * 5; // 5 min

    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    if (attempts > 5) {
      throw new UnauthorizedException(
        'Too many attempts.',
      );
    }

    // verify tempToken and extract userId
    let payload: { sub: string; roles: string[] };
    try {
      payload = await this.tempTokenService.verifyAsync(tempToken);
      // tempTokenService może być np. JwtService z krótkim TTL
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const userId = payload.sub;

    // get user and OTP
    const user = await this.userRepo.findOne(userId);
    if (!user || !user.twoFactorOtp) {
      throw new UnauthorizedException('2FA not set or invalid');
    }

    if (user.twoFactorOtpExpires! < new Date()) {
      throw new UnauthorizedException('Code expired');
    }

    // check OTP
    console.log(otp, user.twoFactorOtp)
    const isValid = await this.hashService.verify(user.twoFactorOtp, otp);
    if (!isValid) {
      throw new UnauthorizedException('Invalid code');
    }

    // clear OTP
    await this.userRepo.setTwoFactorOtp(user._id as string, null, null);

    // Generate JWT tokens
    const fullPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user._id,
      roles: await this.userRepo.getUserRoles(user._id as string),
    };

    const access_token = await this.accessTokenService.signAsync(fullPayload);
    const refresh_token = await this.refreshTokenService.signAsync(fullPayload);

    await this.redis.del(`2fa_attempts:${tempToken}`);
    return { access_token, refresh_token };
  }
}