import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserRequest } from '../interfaces';

// * To monitor the execution time of endpoints that use hashing

@Injectable()
export class HashInterceptor implements NestInterceptor {
  intercept<T>(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
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
