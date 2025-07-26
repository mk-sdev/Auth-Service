import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserRequest } from './interfaces';

// * To monitor the execution time of endpoints that use hashing

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<UserRequest>();
    console.log(`[${req.method}] ${req.url} - incoming...`);
    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(
            `[${req.method}] ${req.url} - done in ${Date.now() - now}ms`,
          ),
        ),
      );
  }
}
