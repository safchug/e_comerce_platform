import { createHash, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { TokenHasher } from '../../application/ports/token-hasher.port';

@Injectable()
export class Sha256TokenHasher implements TokenHasher {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  matches(token: string, hash: string): boolean {
    const candidate = Buffer.from(this.hash(token), 'hex');
    const expected = Buffer.from(hash, 'hex');
    if (candidate.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  }
}
