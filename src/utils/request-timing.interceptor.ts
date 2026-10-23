import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, finalize } from 'rxjs';
import { UserRequest } from './interfaces';

// * To monitor the execution time of endpoints that use hashing

@Injectable()
export class RequestTimingInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const now = Date.now();
    const req = context.switchToHttp().getRequest<UserRequest>();
    console.log(`[${req.method}] ${req.url} - incoming...`);
    return next.handle().pipe(
      finalize(() => {
        console.log(
          `[${req.method}] ${req.url} - completed in ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
