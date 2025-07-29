import { Module } from '@nestjs/common';
import { HashService } from './hash.service';
import { HashInterceptor } from './hash.interceptor';

@Module({
  providers: [HashService, HashInterceptor],
  exports: [HashService, HashInterceptor],
})
export class HashModule {}
