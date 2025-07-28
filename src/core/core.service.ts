import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { HashService } from './hash.service';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { TokenRepoService } from '../repository/tokenRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { account_deletion_lifespan } from '../utils/constants';
import { JwtPayload } from '../utils/interfaces';

type NewPayload = Omit<JwtPayload, 'iat' | 'exp'>;

@Injectable()
export class CoreService {
  constructor(
    private readonly passwordRepoService: PasswordRepoService,
    private readonly tokenRepoService: TokenRepoService,
    private readonly userCrudRepoService: UserCrudRepoService,
    @Inject('JWT_ACCESS_SERVICE')
    private readonly accessTokenService: JwtService,
    @Inject('JWT_REFRESH_SERVICE')
    private readonly refreshTokenService: JwtService,
    private readonly hashService: HashService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {
    console.log('[CoreService] constructed');
  }

  async login(
    email: string,
    password?: string, // when logging via OAuth password is not needed
  ): Promise<{ access_token: string; refresh_token: string }> {
    const key = `login_attempts:${email}`;
    const ttlSeconds = 60 * 5; // 5 minutes

    // increment and get number if attempts
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      // set a key that expires ttlSeconds after the first attempt
      await this.redis.expire(key, ttlSeconds);
    }

    if (attempts > 5) {
      throw new UnauthorizedException(
        'Too many login attempts. Try again later.',
      );
    }

    const user = await this.userCrudRepoService.findOneByEmail(email); //* find a user with a provided email
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isVerified) {
      throw new UnauthorizedException(
        'Verify your account in order to sign in.',
      );
    }

    if (password) {
      //* check if the password matches
      const isPasswordValid: boolean = await this.hashService.verify(
        user.password!,
        password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException();
      }
    }
    //* if the user is found and the password matches, generate a JWT token and send it back
    const payload: NewPayload = {
      sub: user._id as string,
      roles: user.roles,
    };
    const access_token = await this.accessTokenService.signAsync(payload);
    const refresh_token = await this.refreshTokenService.signAsync(payload);

    const hashedRefreshToken: string =
      await this.hashService.hash(refresh_token);

    //* save refresh token to the db
    await this.tokenRepoService.addRefreshToken(
      user._id as string,
      hashedRefreshToken,
    );

    await this.tokenRepoService.trimRefreshTokens(String(user._id));

    if (user.isDeletionPending) {
      await this.userCrudRepoService.cancelScheduledDeletion(
        user._id as string,
      );
    }

    await this.redis.del(key);

    return {
      access_token,
      refresh_token,
    };
  }

  async logout(refresh_token: string) {
    try {
      const payload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);

      //get the user
      const user = await this.userCrudRepoService.findOne(payload.sub);
      //iterate over its refreshTokens
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      for (const hashedToken of user.refreshTokens) {
        //compare via this.hashService.verify
        const isMatch = await this.hashService.verify(
          hashedToken,
          refresh_token,
        );
        if (isMatch) {
          //removed the token from the db
          await this.tokenRepoService.removeRefreshToken(
            payload.sub, //
            hashedToken,
          );
        }
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.warn('Logout error:', err.message);
    }
  }

  async globalLogout(id: string) {
    await this.tokenRepoService.clearTokens(id);
  }

  // creates both new access and refresh tokens
  async refreshTokens(
    refresh_token: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const refreshPayload: JwtPayload =
        await this.refreshTokenService.verifyAsync(refresh_token);
      const user = await this.userCrudRepoService.findOne(refreshPayload.sub);

      if (!user) throw new UnauthorizedException('Invalid refresh token');

      const newPayload: NewPayload = {
        sub: user._id as string,
        roles: user.roles ?? ['USER'],
      };

      const newAccessToken =
        await this.accessTokenService.signAsync(newPayload);
      const newRefreshToken =
        await this.refreshTokenService.signAsync(newPayload);

      const newHashedRefreshToken =
        await this.hashService.hash(newRefreshToken);

      let validTokenFound = false;

      for (const hashedToken of user.refreshTokens) {
        const isMatch = await this.hashService.verify(
          hashedToken,
          refresh_token,
        );
        if (isMatch) {
          validTokenFound = true;
          await this.tokenRepoService.replaceRefreshToken(
            user._id as string,
            hashedToken,
            newHashedRefreshToken,
          );
          break;
        }
      }

      if (!validTokenFound) {
        throw new UnauthorizedException('Refresh token not recognized');
      }

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (err) {
      console.error(err);
      throw new UnauthorizedException('Could not refresh tokens: ' + err);
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      throw new Error('New password cannot be the same as the old one');
    }

    const user = await this.userCrudRepoService.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    const isPasswordValid = await this.hashService.verify(
      user.password!,
      currentPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await this.hashService.hash(newPassword);
    await this.passwordRepoService.updatePasswordAndClearTokens(
      user.email,
      hashedNewPassword,
    );
  }

  async setPassword(id: string, password: string) {
    const user = await this.userCrudRepoService.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }
    if (user.password) {
      throw new ConflictException(
        'The user has a password. Use /change-password instead.',
      );
    }

    const hashedNewPassword = await this.hashService.hash(password);
    await this.passwordRepoService.updatePasswordAndClearTokens(
      user.email,
      hashedNewPassword,
    );
  }

  async markForDeletion(id: string, password: string) {
    // TODO: add a cron job for deleting accounts after the deletionScheduledAt time
    const user = await this.userCrudRepoService.findOne(id);
    if (!user) {
      throw new ConflictException('The user of the given email doesn`t exist');
    }

    if (user.password) {
      const isPasswordValid = await this.hashService.verify(
        user.password,
        password,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    const deletionScheduledAt = Date.now() + account_deletion_lifespan;
    await this.userCrudRepoService.markUserForDeletion(
      user.email,
      deletionScheduledAt,
    );
  }
}
