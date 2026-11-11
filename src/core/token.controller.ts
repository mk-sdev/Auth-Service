import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ChangeEmailDto } from '../dtos/change-email.dto';
import { EmailDto } from '../dtos/email.dto';
import { RegisterDto } from '../dtos/register.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { Id } from '../decorators/id.decorator';
import { JwtGuard } from '../guards/jwt.guard';
import { TokenService } from './token.service';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { AuditAction } from '../decorators/audit-action.decorator';
import { Request } from 'express';
import { RequestTimingInterceptor } from '../utils/request-timing.interceptor';

/*
 This controller contains endpoints that receive or create tokens, 
 such as verification tokens, email change tokens,or password reset tokens.
 These tokens are randomly generated strings of characters, not JWTs.
*/
@Controller()
@UseInterceptors(AuditInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class TokenController {
  constructor(private readonly tokenService: TokenService) { }

  @Post('register')
  @AuditAction('REGISTER')
  @UseInterceptors(RequestTimingInterceptor)
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const message = 'Verification link has been sent to your email address';
    await this.tokenService.register(registerDto.email, registerDto.password, req);
    return { message };
  }

  @Get('verify-account')
  async verify(@Query('token') token: string) {
    await this.tokenService.verifyToken(token);
    return {
      message: 'The account has been verified successfully',
    };
  }

  @Patch('change-email')
  @AuditAction('CHANGE_EMAIL')
  @UseInterceptors(RequestTimingInterceptor)
  @UseGuards(JwtGuard)
  async changeEmail(
    @Id() id: string,
    @Body() body: ChangeEmailDto,
    @Req() req: Request,
  ) {
    const { newEmail, password } = body;

    await this.tokenService.changeEmail(id, newEmail, password, req);

    return {
      message:
        'If the email address can be changed, a confirmation message will be sent.',
    };
  }

  @Get('verify-email')
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    await this.tokenService.verifyEmail(token);

    return { message: 'Email has been successfully verified and changed' };
  }

  @Patch('remind-password')
  @AuditAction('REMIND_PASSWORD')
  @UseInterceptors(RequestTimingInterceptor)
  @HttpCode(HttpStatus.OK)
  async remindPassword(@Body() body: EmailDto, @Req() req: Request) {
    const { email } = body;

    const message =
      'Password reset instruction has been sent to the email address provided';

    await this.tokenService.remindPassword(email, message, req);
    return {
      message,
    };
  }

  @Patch('reset-password')
  @AuditAction('RESET_PASSWORD')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.tokenService.resetPassword(body.token, body.newPassword);
  }
}
