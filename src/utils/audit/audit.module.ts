import { Module } from '@nestjs/common';
import { AuditLoggerService } from './audit.service';

@Module({
  providers: [AuditLoggerService],
  exports: [AuditLoggerService],
})
export class AuditModule {}
