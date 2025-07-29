import { Module } from '@nestjs/common';
import { AuditLoggerService } from './audit.service';
import { AuditInterceptor } from './audit.interceptor';

@Module({
  providers: [AuditLoggerService, AuditInterceptor],
  exports: [AuditLoggerService, AuditInterceptor],
})
export class AuditModule {}
