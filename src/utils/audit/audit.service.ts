import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { AuditDetails } from './audit-utils';

const auditLogger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});

@Injectable()
export class AuditLoggerService {
  private write(
    level: 'info' | 'warn' | 'error',
    userId: string,
    action: string,
    // ip?: string,
    details?: AuditDetails,
  ) {
    auditLogger.log(level, {
      userId,
      action,
      // ip,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  log(userId: string, action: string, details?: AuditDetails) {
    this.write('info', userId, action, details);
  }

  // for admin routes
  admin(adminId: string, action: string, details?: AuditDetails) {
    this.write('info', adminId, action, details);
  }

  // invalid password etc.
  warn(userId: string, action: string, details?: AuditDetails) {
    this.write('warn', userId, action, details);
  }

  // invalid token
  unauthorized(
    userId: string,
    action: string,
    // ip?: string,
    details?: AuditDetails,
  ) {
    this.write('error', userId, action, details);
  }
}
