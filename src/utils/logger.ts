// audit-logger.service.ts
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

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
  log(userId: string, action: string, details?: Record<string, any>) {
    auditLogger.info({
      userId,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
