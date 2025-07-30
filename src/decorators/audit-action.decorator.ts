// * to log successful actions performed by admins and normal users
// * the value of the decorator is passed to the audit interceptor
import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit:action';

export type AuditType = 'user' | 'admin'; // | 'warn' | 'unauthorized';

export const AuditAction = (action: string, type: AuditType = 'user') =>
  SetMetadata(AUDIT_ACTION_KEY, { action, type });
