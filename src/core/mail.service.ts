import { MailerService } from '@nestjs-modules/mailer';
import { URL } from '../utils/constants';

export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  private readonly footer =
    "<span style='color: red'>Beware of phishing attempts. Always verify the sender's email address and avoid clicking on suspicious links.</span>";

  async sendMailWithToken(
    toEmail: string,
    token: string,
    subject: string,
    purpose: string,
    contextData?: Record<string, unknown>,
    baseUrl: string = URL,
    tokenQueryParamName: string = 'token',
    path?: string,
  ) {
    const tokenPath = path ? `${path}` : '';
    const confirmationLink = `${baseUrl}${tokenPath}?${tokenQueryParamName}=${token}`;

    const context = contextData
      ? { ...contextData, confirmationLink }
      : { confirmationLink };

    const html = `
              <h3>Welcome!</h3>
              <p>Click the link below in order to ${purpose}:</p>
              <a href="${confirmationLink}">${confirmationLink}</a>
              <p>If that's not you, ignore this message.</p>
              ${this.footer}
            `;

    if (process.env.node_env === 'production')
      await this.mailerService.sendMail({
        to: toEmail,
        subject,
        template: undefined,
        context,
        html,
      });
    else console.log(html);
  }

  async sendSuspiciousLoginEmail(toEmail: string, ip: string) {
    const html = `
              <h3>Suspicious Login Attempt Detected</h3>
              <p>We detected a suspicious login attempt to your account from IP address: ${ip}.</p>
              <p>If this was you, no further action is needed. If you did not attempt to log in, please secure your account immediately by changing your password.</p>
              ${this.footer}
            `;

    if (process.env.node_env === 'production')
      await this.mailerService.sendMail({
        to: toEmail,
        subject: 'Suspicious Login Attempt Detected',
        template: undefined,
        context: {},
        html,
      });
    else console.log(html);
  }

  async sendAccountDeletionAlert(toEmail: string) {
    const html = `
              <h3>Account Deletion Scheduled</h3>
              <p>We're sorry to see you go. Your account has been scheduled for deletion.</p>
              <p>If you change your mind, you can simply log in within 30 days, and the deletion process will be automatically canceled.</p>
              ${this.footer}
            `;

    if (process.env.node_env === 'production')
      await this.mailerService.sendMail({
        to: toEmail,
        subject: 'Account Deletion Scheduled',
        template: undefined,
        context: {},
        html,
      });
    else console.log(html);
  }
}
