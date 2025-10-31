import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditAction } from '../decorators/audit-action.decorator';
import { Id } from '../decorators/id.decorator';
import { ChangePasswordDto } from '../dtos/changePassword.dto';
import { LoginDto } from '../dtos/login.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { HashInterceptor } from '../utils/hash/hash.interceptor';
import { CoreService } from './core.service';
import { accessTokenOptions, refreshTokenOptions } from 'src/utils/constants';
import { Platform } from 'src/decorators/platform.decorator';
import { UserCrudRepoService } from 'src/repository/userCrudRepo.service';
import { SetPasswordDto } from 'src/dtos/set-password.dto';

@Controller()
@UseInterceptors(AuditInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class CoreController {
  constructor(
    private readonly coreService: CoreService,
    private userCrudRepoService: UserCrudRepoService,
  ) {}

  @Get('hello')
  @AuditAction('HELLO')
  getHello(): string {
    return 'Hello World!';
  }

  @Patch('login')
  @AuditAction('LOGIN')
  @UseInterceptors(HashInterceptor)
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
    @Platform() platform: 'web' | 'mobile',
  ) {
    const { access_token, refresh_token } = await this.coreService.login(
      loginDto.email,
      req,
      loginDto.password,
    );

    // cookies
    if (platform === 'web') {
      response.cookie('access_token', access_token, accessTokenOptions);
      response.cookie('refresh_token', refresh_token, refreshTokenOptions);
      return { message: 'Login successful' };
    }

    // headers
    response.setHeader('Authorization', `Bearer ${access_token}`);
    // response.setHeader('X-Refresh-Token', refresh_token);

    return { message: 'Login successful', refresh_token };
  }

  @Patch('logout')
  @UseInterceptors(HashInterceptor)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Platform() platform: 'web' | 'mobile',
    @Body() body?: { refresh_token: string },
  ) {
    let refreshToken: string;

    if (platform === 'web') {
      refreshToken = req.cookies['refresh_token'] as string;
    } else {
      refreshToken = body!.refresh_token;
    }

    // clear cookies only for browsers
    if (platform === 'web') {
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    }

    await this.coreService.logout(refreshToken);

    return { message: 'Logout successful' };
  }

  @Patch('global-logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async globalLogout(
    @Id() id: string,
    @Platform() platform: 'web' | 'mobile',
    @Res({ passthrough: true }) res: Response,
  ) {
    if (platform === 'web') {
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
    }
    await this.coreService.globalLogout(id);
  }

  @Patch('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Platform() platform: 'web' | 'mobile',
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body?: { refresh_token?: string },
  ) {
    let refreshToken: string | undefined;

    if (platform === 'web')
      refreshToken = req.cookies['refresh_token'] as string | undefined;
    else refreshToken = body?.refresh_token;

    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    const refreshed = await this.coreService.refreshTokens(refreshToken);

    if (platform === 'web') {
      res.cookie('access_token', refreshed.access_token, accessTokenOptions);
      res.cookie('refresh_token', refreshed.refresh_token, refreshTokenOptions);
      return { message: 'Refresh successful' };
    }

    return {
      message: 'Refresh successful',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    };
  }

  /**
   *
   * @description On mobile, if the app wants to know i a user is logged in, it simply checks if the secure storage contains a valid access token. But browsers don't have an access to cookies if the are httpOnly. Therefore browser needs to ask the backend to check if the user is logged in.
   */
  @Get('is-logged') // * cookies only
  @UseGuards(JwtGuard)
  returnIsLogged(): true {
    return true;
  }

  @Patch('change-password')
  @AuditAction('CHANGE_PASSWORD')
  @UseGuards(JwtGuard)
  async changePassword(
    @Id() id: string,
    @Body() body: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.coreService.changePassword(
      id,
      body.password,
      body.newPassword,
      req,
    );
  }

  @Patch('set-password')
  @AuditAction('SET_PASSWORD')
  @UseGuards(JwtGuard)
  async setPassword(
    @Id() id: string,
    @Body() body: SetPasswordDto,
    @Req() req: Request,
  ) {
    return this.coreService.setPassword(id, body.password, req);
  }

  @Delete('delete-account')
  @AuditAction('DELETE_ACCOUNT')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async deleteAccount(
    @Id() id: string,
    @Body() body: { password: string },
    @Req() req: Request,
  ) {
    await this.coreService.markForDeletion(id, body.password, req);
  }

  @Get('userinfo')
  @UseGuards(JwtGuard)
  async getUserInfo(@Id() id: string) {
    const user = await this.userCrudRepoService.findOne(id);

    if (!user) throw new NotFoundException('User not found');

    return {
      email: user.email,
      roles: user.roles,
      hasPassword: user.password ? true : false, // OAuth users may not have password
    };
  }
}
