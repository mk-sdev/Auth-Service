import {
  Body,
  Controller,
  Delete,
  Get,
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
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { LoginDto } from '../dtos/login.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { RequestTimingInterceptor } from '../utils/request-timing.interceptor';
import { CoreService } from './core.service';
import { accessTokenOptions, refreshTokenOptions, twoFATokenOptions } from 'src/utils/constants';
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

  ) { }

  @Get('health-check')
  getHealthStatus(): { uptime: number; status: string; timestamp: Date } {
    const status = {
      uptime: process.uptime(),
      status: 'ok',
      timestamp: new Date(),
    };
    return status;
  }

  @Patch('login')
  @AuditAction('LOGIN')
  @UseInterceptors(RequestTimingInterceptor)
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    const result = await this.coreService.login(
      loginDto.email,
      req,
      loginDto.password,
    );

    if ('_2fa_token' in result) {
      response.cookie('2fa_token', result._2fa_token, twoFATokenOptions)
      return result;
    }

    const { access_token, refresh_token } = result;

    response.cookie('access_token', access_token, accessTokenOptions);
    response.cookie('refresh_token', refresh_token, refreshTokenOptions);
    return { message: 'Login successful' };
  }

  @Delete('logout')
  @UseInterceptors(RequestTimingInterceptor)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'] as string;

    res.clearCookie('access_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });

    await this.coreService.logout(refreshToken);

    return { message: 'Logout successful' };
  }

  @Delete('global-logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async globalLogout(
    @Id() id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie('access_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    res.clearCookie('refresh_token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
    await this.coreService.globalLogout(id);
  }

  @Patch('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'] as string | undefined;

    if (!refreshToken)
      throw new UnauthorizedException('No refresh token provided');

    const refreshed = await this.coreService.refreshTokens(refreshToken);

    res.cookie('access_token', refreshed.access_token, accessTokenOptions);
    res.cookie('refresh_token', refreshed.refresh_token, refreshTokenOptions);
    return { message: 'Refresh successful' };
  }

  /**
   *
   * @description Checks whether the browser session has a valid access token cookie.
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
