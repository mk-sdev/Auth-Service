import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { AuditModule } from '../utils/audit/audit.module';
import { MailQueueService } from './mail-queue.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    AuditModule,
    MailerModule.forRoot({
      transport:
        process.env.NODE_ENV === 'production'
          ? {
              host: 'sandbox.smtp.mailtrap.io',
              port: 587,
              secure: false,
              auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
              },
            }
          : {
              streamTransport: true,
              buffer: true,
              newline: 'unix',
            },
      defaults: {
        from: '"Twoja Apka" <no-reply@twoja-apka.pl>',
      },
    }),
  ],
  providers: [MailService, MailQueueService],
  exports: [MailService, MailQueueService],
})
export class MailModule {}
