import { PasswordHasher } from '../../ports/password-hasher.port';

/** Deterministic fake: no real hashing, keeps unit tests fast and I/O-free. */
export class FakePasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}
