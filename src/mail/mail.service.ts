import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  account_verification_lifespan,
  email_change_lifespan,
  FRONTEND_URL,
  password_reset_lifespan,
  URL,
} from '../utils/constants';
import { RepositoryService } from '../repository/repository.service';
import { HashService } from '../hash.service';

@Injectable()
export class MailService {
  constructor(
    private repositoryService: RepositoryService,
    private readonly mailerService: MailerService,
    private readonly hashService: HashService,
  ) {}

  async sendMailWithToken(
    toEmail: string,
    token: string,
    subject: string,
    purpose: string,
    contextData?: Record<string, unknown>,
    baseUrl: string = 'http://localhost:3000',
    tokenQueryParamName: string = 'token',
    path?: string,
  ) {
    const tokenPath = path ? `${path}` : '';
    const confirmationLink = `${baseUrl}${tokenPath}?${tokenQueryParamName}=${token}`;

    const context = contextData
      ? { ...contextData, confirmationLink }
      : { confirmationLink };
    console.log(
      `
        <h3>Welcome!</h3>
        <p>Click the link below in order to ${purpose}:</p>
        <a href="${confirmationLink}">${confirmationLink}</a>
        <p>If that's not you, ignore this message.</p>
      `,
    );
    // await this.mailerService.sendMail({
    //   to: toEmail,
    //   subject,
    //   template: undefined,
    //   context,
    //   html: `
    //       <h3>Welcome!</h3>
    //       <p>Click the link below:</p>
    //       <a href="${confirmationLink}">${confirmationLink}</a>
    //       <p>If that's not you, ignore this message.</p>
    //     `,
    // });
  }

  async register(email: string, password: string): Promise<void> {
    const existingUser = await this.repositoryService.findOneByEmail(email);
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
      await this.repositoryService.setNewVerificationToken(
        email,
        hashedPassword, // in case if the user gave different password than for the first time
        verificationToken,
        verificationTokenExpires,
      );
    else
      // Add the user to the db
      await this.repositoryService.insertOne({
        email,
        password: hashedPassword,
        verificationToken,
        verificationTokenExpires,
      });

    await this.sendMailWithToken(
      email,
      verificationToken,
      'Activate your account',
      'verify you account',
      undefined,
      URL,
      'token',
      '/verify-account',
    );
  }

  // verifies a registration token
  async verifyToken(token: string): Promise<void> {
    // TODO: add a cron job for removing unverified users
    const user = await this.repositoryService.findOneByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.verificationTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }

    await this.repositoryService.verifyAccount(user._id as string);
  }

  async changeEmail(id: string, newEmail: string, password: string) {
    const user = await this.repositoryService.findOne(id);
    if (!user) {
      throw new NotFoundException(
        'User with the given email address doesn`t exist',
      );
    }

    const isPasswordValid: boolean = await this.hashService.verify(
      user.password,
      password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect password');
    }

    const emailExists = await this.repositoryService.findOneByEmail(newEmail);
    if (emailExists) {
      throw new ConflictException('This email is already in use!');
    }

    const verificationToken = randomUUID();
    const emailChangeTokenExpires = Date.now() + email_change_lifespan;

    await this.repositoryService.markEmailChangePending(
      id,
      newEmail,
      verificationToken,
      emailChangeTokenExpires,
    );

    await this.sendMailWithToken(
      newEmail,
      verificationToken,
      'Confirm email address change',
      'confirm email change',
      {},
      URL,
      'token',
      '/verify-email',
    );
  }

  async verifyEmail(token: string): Promise<void> {
    // TODO: add a cron job for removing unverified emails
    const user = await this.repositoryService.findOneByEmailToken(token);

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (user.emailChangeTokenExpires! < Date.now()) {
      throw new BadRequestException('The token has expired');
    }
    if (!user.pendingEmail) {
      throw new BadRequestException('No new email address to verify');
    }

    await this.repositoryService.confirmEmailChange(
      String(user._id),
      user.pendingEmail,
    );
  }

  async remindPassword(email: string, message: string) {
    const user = await this.repositoryService.findOneByEmail(email);

    if (!user) {
      // Do not do anything, in order to not to reveal the account exists in the database
      return {
        message,
      };
    }

    const resetToken = randomUUID();
    const passwordResetTokenExpires = Date.now() + password_reset_lifespan;

    await this.repositoryService.remindPassword(
      email,
      resetToken,
      passwordResetTokenExpires,
    );

    await this.sendMailWithToken(
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
      await this.repositoryService.findOneByPasswordResetToken(token);
    if (!user) throw new NotFoundException('Invalid token');
    if (
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < Date.now()
    )
      throw new UnauthorizedException('Token expired');
    const password: string = await this.hashService.hash(newPassword);
    await this.repositoryService.setNewPasswordFromResetToken(token, password);

    return {
      message:
        'New password has been set successfully. You can now use it to sign in.',
    };
  }
}
