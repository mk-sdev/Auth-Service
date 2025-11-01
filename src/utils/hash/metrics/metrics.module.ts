import { Module } from '@nestjs/common';
import {
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';

@Module({
  imports: [PrometheusModule.register()],
  providers: [
    makeHistogramProvider({
      name: 'hashing_duration_seconds',
      help: 'Histogram measuring hash duration',
      buckets: [0.1, 0.5, 1, 2, 5],
    }),
  ],
  exports: ['PROM_METRIC_HASHING_DURATION_SECONDS'],
})
export class MetricsModule {}
