import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { performance } from 'node:perf_hooks';
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
import { InvalidCredentialsException } from '../utils/invalid-credentials.exception';
import { MailQueueService } from '../mail/mail-queue.service';

const MIN_REGISTER_RESPONSE_MS = 250;
const MIN_CHANGE_EMAIL_RESPONSE_MS = 250;
const MIN_REMIND_PASSWORD_RESPONSE_MS = 75;

@Injectable()
export class TokenService {
  constructor(
    private readonly passwordRepoService: PasswordRepoService,
    private readonly verificationRepoService: VerificationRepoService,
    private readonly userCrudRepoService: UserCrudRepoService,
    private readonly hashService: HashService,
    private readonly auditLogger: AuditLoggerService,
    private readonly mailQueue: MailQueueService,
  ) { }

  async register(email: string, password: string, req?: Request): Promise<void> {
    const startedAt = performance.now();
    const { ip, path, method } = req
      ? createAuditDetails(req)
      : { ip: 'unknown', path: '/register', method: 'POST' };
    const existingUser = await this.userCrudRepoService.findOneByEmail(email);
    // Hash for every request so an existing verified account does not skip
    // the expensive password-hashing work performed for other registrations.
    const hashedPassword = await this.hashService.hash(password);
    if (existingUser && existingUser.isVerified) {
      // do not do anything to not to reveal the account exists in the db
    } else {
      const verificationToken = randomUUID();
      const verificationTokenExpires =
        Date.now() + account_verification_lifespan;

      if (existingUser)
        await this.verificationRepoService.setNewVerificationToken(
          email,
          hashedPassword,
          verificationToken,
          verificationTokenExpires,
        );
      else
        await this.userCrudRepoService.insertOne({
          email,
          password: hashedPassword,
          verificationToken,
          verificationTokenExpires,
        });

      await this.mailQueue.enqueueTokenEmail({
        toEmail: email,
        token: verificationToken,
        subject: 'Activate your account',
        purpose: 'verify your account',
        baseUrl: FRONTEND_URL,
        path: '/verify-account',
        audit: { event: 'REGISTRATION_EMAIL_FAILED', ip, path, method, email },
      });
    }

    const remainingDelay =
      MIN_REGISTER_RESPONSE_MS - (performance.now() - startedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
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
      throw new InvalidCredentialsException();
    }

    if (
      !user.password ||
      !(await this.hashService.verify(user.password, password))
    ) {
      this.auditLogger.warn(id, 'CHANGE_EMAIL_INVALID_PASSWORD', {
        ip,
        path,
        method,
      });
      throw new InvalidCredentialsException();
    }

    if (user.email === newEmail)
      throw new BadRequestException('New email cannot be the same as current email');

    const startedAt = performance.now();
    const emailExists = await this.userCrudRepoService.findOneByEmail(newEmail);
    if (emailExists) {
      this.auditLogger.warn(id, 'CHANGE_EMAIL_TARGET_ALREADY_IN_USE', {
        ip,
        path,
        method,
      });
    } else {
      const verificationToken = randomUUID();
      const emailChangeTokenExpires = Date.now() + email_change_lifespan;

      await this.verificationRepoService.markEmailChangePending(
        id,
        newEmail,
        verificationToken,
        emailChangeTokenExpires,
      );

      await this.mailQueue.enqueueTokenEmail({
        toEmail: newEmail,
        token: verificationToken,
        subject: 'Confirm email address change',
        purpose: 'confirm email change',
        contextData: {},
        baseUrl: FRONTEND_URL,
        path: '/verify-email',
        audit: { event: 'EMAIL_CHANGE_CONFIRMATION_FAILED', ip, path, method },
      });
    }

    const remainingDelay =
      MIN_CHANGE_EMAIL_RESPONSE_MS - (performance.now() - startedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }
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
    const startedAt = performance.now();
    const { ip, path, method } = createAuditDetails(req);
    const resetToken = randomUUID();
    const passwordResetTokenExpires = Date.now() + password_reset_lifespan;
    const updatedUsers = await this.passwordRepoService.remindPassword(
      email,
      resetToken,
      passwordResetTokenExpires,
    );

    if (updatedUsers === 0) {
      this.auditLogger.warn('anonymous', 'REMIND_PASSWORD_USER_NOT_FOUND', {
        ip,
        path,
        method,
        email,
      });
    } else {
      await this.mailQueue.enqueueTokenEmail({
        toEmail: email,
        token: resetToken,
        subject: 'Password reset instruction',
        purpose: 'reset your password',
        contextData: {},
        baseUrl: FRONTEND_URL,
        path: '/reset-password',
        audit: { event: 'PASSWORD_RESET_EMAIL_FAILED', ip, path, method, email },
      });
    }

    const remainingDelay =
      MIN_REMIND_PASSWORD_RESPONSE_MS - (performance.now() - startedAt);
    if (remainingDelay > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingDelay));
    }

    return { message };
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
