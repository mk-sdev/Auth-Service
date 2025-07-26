import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  async hash(data: string): Promise<string> {
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
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
