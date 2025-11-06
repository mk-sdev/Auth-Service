import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { PasswordRepoService } from '../repository/passwordRepo.service';
import { UserCrudRepoService } from '../repository/userCrudRepo.service';
import { VerificationRepoService } from '../repository/verificationRepo.service';
import { createAuditDetails } from '../utils/audit/audit-utils';
import { AuditLoggerService } from '../utils/audit/audit.service';
import {
  account_verification_lifespan,
  email_change_lifespan,
  FRONTEND_URL,
  password_reset_lifespan,
} from '../utils/constants';
import { HashService } from '../utils/hash/hash.service';
import { MailService } from './mail.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly passwordRepoService: PasswordRepoService,
    private readonly verificationRepoService: VerificationRepoService,
    private readonly userCrudRepoService: UserCrudRepoService,
    private readonly hashService: HashService,
    private readonly auditLogger: AuditLoggerService,
    private readonly mailService: MailService,
  ) {}

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.userCrudRepoService.findOneByEmail(email);
    if (existingUser && existingUser.isVerified) {
      // do not do anything to not to reveal the account exists in the db
      // throw new ConflictException('Email already in use');
      return;
    }

    const hashedPassword = await this.hashService.hash(password);
    const verificationToken = randomUUID();
    const verificationTokenExpires = Date.now() + account_verification_lifespan;

    if (existingUser && !existingUser.isVerified)
      // set new verification token and its expiration date
      await this.verificationRepoService.setNewVerificationToken(
        email,
        hashedPassword, // in case if the user gave different password than for the first time
        verificationToken,
        verificationTokenExpires,
      );
    else
      // Add the user to the db
      await this.userCrudRepoService.insertOne({
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
      });

    await this.mailService.sendMailWithToken(
      email,
      verificationToken,
      'Activate your account',
      'verify you account',
      undefined,
      FRONTEND_URL,
      'token',
      '/verify-account',
    );
  }

  // verifies a registration token
  async verifyToken(token: string): Promise<void> {
    const user =
      await this.verificationRepoService.findOneByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.verificationTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }

    await this.userCrudRepoService.verifyAccount(user._id as string);
  }

  async changeEmail(
    id: string,
    newEmail: string,
    password: string,
    req: Request,
  ) {
    const { ip, path, method } = createAuditDetails(req);

    const user = await this.userCrudRepoService.findOne(id);
    if (!user) {
      this.auditLogger.warn(id, 'CHANGE_EMAIL_USER_NOT_FOUND', {
        ip,
        path,
        method,
      });
      throw new NotFoundException(
        'User with the given email address doesn`t exist',
      );
    }

    const isPasswordValid: boolean = await this.hashService.verify(
      user.password!,
      password,
    );
    if (!isPasswordValid) {
      this.auditLogger.warn(id, 'CHANGE_EMAIL_INVALID_PASSWORD', {
        ip,
        path,
        method,
      });
      throw new UnauthorizedException('Incorrect password');
    }

    const emailExists = await this.userCrudRepoService.findOneByEmail(newEmail);
    if (emailExists) {
      throw new ConflictException('This email is already in use!');
    }

    const verificationToken = randomUUID();
    const emailChangeTokenExpires = Date.now() + email_change_lifespan;

    await this.verificationRepoService.markEmailChangePending(
      id,
      newEmail,
      verificationToken,
      emailChangeTokenExpires,
    );

    await this.mailService.sendMailWithToken(
      newEmail,
      verificationToken,
      'Confirm email address change',
      'confirm email change',
      {},
      FRONTEND_URL,
      'token',
      '/verify-email',
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.verificationRepoService.findOneByEmailToken(token);

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.emailChangeTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }
    if (!user.pendingEmail) {
      throw new BadRequestException('No new email address to verify');
    }

    await this.userCrudRepoService.confirmEmailChange(
      String(user._id),
      user.pendingEmail,
    );
  }

  async remindPassword(email: string, message: string, req: Request) {
    const { ip, path, method } = createAuditDetails(req);

    const user = await this.userCrudRepoService.findOneByEmail(email);

    if (!user) {
      this.auditLogger.warn('anonymous', 'REMIND_PASSWORD_USER_NOT_FOUND', {
        ip,
        path,
        method,
        email,
      });
      // Do not do anything, in order to not to reveal the account exists in the database
      return {
        message,
      };
    }

    const resetToken = randomUUID();
    const passwordResetTokenExpires = Date.now() + password_reset_lifespan;

    await this.passwordRepoService.remindPassword(
      email,
      resetToken,
      passwordResetTokenExpires,
    );

    await this.mailService.sendMailWithToken(
      email,
      resetToken,
      'Password reset instruction',
      'reset your password',
      {},
      FRONTEND_URL,
      'token',
      '/reset-password',
    );
  }

  async resetPassword(token: string, newPassword: string) {
    const user =
      await this.verificationRepoService.findOneByPasswordResetToken(token);
    if (!user) throw new NotFoundException('Invalid token');
    if (
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < Date.now()
    )
      throw new UnauthorizedException('Token expired');
    const password: string = await this.hashService.hash(newPassword);
    await this.passwordRepoService.setNewPasswordFromResetToken(
      token,
      password,
    );

    return {
      message:
        'New password has been set successfully. You can now use it to sign in.',
    };
  }
}
