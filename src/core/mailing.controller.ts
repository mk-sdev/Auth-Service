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
import { MailingService } from './mailing.service';
import { AuditInterceptor } from '../utils/audit/audit.interceptor';
import { AuditAction } from '../decorators/audit-action.decorator';
import { Request } from 'express';

// * this controller handles mailing-related endpoints
@Controller()
@UseInterceptors(AuditInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true, // deletes additional attributes
    forbidNonWhitelisted: true, // throws exceptions if encounters additional attributes
  }),
)
export class MailingController {
  constructor(private readonly mailService: MailingService) {}

  @Post('register')
  @AuditAction('REGISTER')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const message = 'Verification link has been sent to your email address';
    await this.mailService.register(registerDto.email, registerDto.password);
    return { message };
  }

  @Get('verify-account')
  async verify(@Query('token') token: string) {
    await this.mailService.verifyToken(token);
    return {
      message: 'The account has been verified successfully',
    };
  }

  @Patch('change-email')
  @AuditAction('CHANGE_EMAIL')
  @UseGuards(JwtGuard)
  async changeEmail(
    @Id() id: string,
    @Body() body: ChangeEmailDto,
    @Req() req: Request,
  ) {
    const { newEmail, password } = body;

    await this.mailService.changeEmail(id, newEmail, password, req);

    return { message: 'Email address has been changed successfully' };
  }

  @Get('verify-email')
  async confirmEmailChange(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    await this.mailService.verifyEmail(token);

    return { message: 'Email has been successfully verified and changed' };
  }

  @Patch('remind-password')
  @AuditAction('REMIND_PASSWORD')
  @HttpCode(HttpStatus.OK)
  async remindPassword(@Body() body: EmailDto, @Req() req: Request) {
    const { email } = body;

    const message =
      'Password reset instruction has been sent to the email address provided';

    await this.mailService.remindPassword(email, message, req);
    return {
      message,
    };
  }

  @Patch('reset-password')
  @AuditAction('RESET_PASSWORD')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.mailService.resetPassword(body.token, body.newPassword);
  }
}
