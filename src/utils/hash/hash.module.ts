import { Module } from '@nestjs/common';
import { HashInterceptor } from './hash.interceptor';
import { HashService } from './hash.service';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  providers: [HashService, HashInterceptor],
  imports: [MetricsModule],
  exports: [HashService, HashInterceptor],
})
export class HashModule {}
