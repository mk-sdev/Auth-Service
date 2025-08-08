import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
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

@Controller()
@UseInterceptors(AuditInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

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
      refreshToken = req.cookies['refresh_token'];
    } else {
      refreshToken = body!.refresh_token;
    }

    // czyść ciasteczka tylko dla weba
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
  async globalLogout(@Id() id: string) {
    await this.coreService.globalLogout(id);
  }

  @Patch('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    const refreshed = await this.coreService.refreshTokens(
      // access_token,
      refresh_token,
    );

    return {
      message: 'Refresh successful',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    // `req.user` został ustawiony w JwtGuard po zweryfikowaniu tokena
    return req.user;
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
    @Body() body: Omit<ChangePasswordDto, 'password'>,
    @Req() req: Request,
  ) {
    return this.coreService.setPassword(id, body.newPassword, req);
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

  //* dev
  @Get('userinfo')
  getUserInfo(@Headers('authorization') authHeader: string) {
    // Check if there is a header and whether it is in the "bearer token" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    if (
      !token ||
      token === 'null' ||
      token === 'undefined' ||
      token.trim() === ''
    ) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    return {
      id: 123,
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com',
      tokenReceived: token,
    };
  }
}
