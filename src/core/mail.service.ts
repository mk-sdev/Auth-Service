import { MailerService } from '@nestjs-modules/mailer';
import { URL } from '../utils/constants';

export class MailService {
  constructor(private readonly mailerService: MailerService) {}

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
}
