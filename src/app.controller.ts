import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { Id } from './decorators/id.decorator';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { LoginDto } from './dtos/login.dto';
import { JwtGuard } from './guards/jwt.guard';
import { LoggingInterceptor } from './logging.interceptor';

@Controller()
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello World!';
  }

  @Patch('login')
  @UseInterceptors(LoggingInterceptor)
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, refresh_token } = await this.appService.login(
      loginDto.email,
      loginDto.password,
    );

    response.setHeader('Authorization', `Bearer ${access_token}`);
    // response.setHeader('X-Refresh-Token', refresh_token);

    return { message: 'Login successful', refresh_token };
  }

  @Patch('logout')
  @UseInterceptors(LoggingInterceptor)
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async logout(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    await this.appService.logout(refresh_token);
    return { message: 'Logout successful' };
  }

  @Patch('global-logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async globalLogout(@Id() id: string) {
    await this.appService.globalLogout(id);
  }

  @Patch('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refresh_token: string }) {
    const { refresh_token } = body;
    const refreshed = await this.appService.refreshTokens(
      // access_token,
      refresh_token,
    );

    return {
      message: 'Refresh successful',
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
    };
  }

  @Patch('change-password')
  @UseGuards(JwtGuard)
  async changePassword(@Id() id: string, @Body() body: ChangePasswordDto) {
    return this.appService.changePassword(id, body.password, body.newPassword);
  }

  @Delete('delete-account')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  async deleteAccount(@Id() id: string, @Body() body: { password: string }) {
    await this.appService.markForDeletion(id, body.password);
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
