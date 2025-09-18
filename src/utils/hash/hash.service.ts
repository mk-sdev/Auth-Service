import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import * as argon2 from 'argon2';
import { Histogram } from 'prom-client';

@Injectable()
export class HashService {
  constructor(
    @InjectMetric('hashing_duration_seconds')
    private readonly hashingDurationHistogram: Histogram<string>,
  ) {}

  async hash(data: string): Promise<string> {
    const endTimer = this.hashingDurationHistogram.startTimer();
    try {
      const options =
        process.env.NODE_ENV !== 'test'
          ? {
              type: argon2.argon2id,
              timeCost: 4,
              memoryCost: 2 ** 16,
              parallelism: 2,
            }
          : undefined;

      return argon2.hash(data, options);
    } finally {
      endTimer();
    }
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
