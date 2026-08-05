import { TokenHasher } from '../../ports/token-hasher.port';

/** Deterministic fake mirroring the real SHA-256 hasher's full-length behavior. */
export class FakeTokenHasher implements TokenHasher {
  hash(token: string): string {
    return `hashed:${token}`;
  }

  matches(token: string, hash: string): boolean {
    return hash === this.hash(token);
  }
}
