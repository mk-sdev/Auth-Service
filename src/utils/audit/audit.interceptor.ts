import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_ACTION_KEY } from '../../decorators/audit-action.decorator';
import { UserRequest } from '../interfaces';
import { AuditLoggerService } from './audit.service';
import { AuditDetails, createAuditDetails } from './audit-utils';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditLogger: AuditLoggerService,
  ) {}

  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const auditMeta = this.reflector.get<{ action: string; type: string }>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    if (!auditMeta) return next.handle();

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<UserRequest>();
    const userId = req.user?.sub || 'anonymous';
    const ip =
      req.headers['x-forwarded-for']?.toString() || req.ip || 'unknown';

    const { action, type } = auditMeta;
    const details: AuditDetails = createAuditDetails(req);

    if (type === 'admin' && req.params?.id) {
      details.moderatedUserId = req.params.id;
    }

    return next.handle().pipe(
      tap(() => {
        switch (type) {
          case 'admin':
            this.auditLogger.admin(userId, action, details);
            break;
          case 'warn':
            this.auditLogger.warn(userId, action, details);
            break;
          case 'unauthorized':
            this.auditLogger.unauthorized(userId, action, details);
            break;
          default:
            this.auditLogger.log(userId, action, details);
        }
      }),
    );
  }
}
