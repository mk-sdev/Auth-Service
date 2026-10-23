import { Module } from '@nestjs/common';
import { HashService } from './hash.service';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  providers: [HashService],
  imports: [MetricsModule],
  exports: [HashService],
})
export class HashModule {}
