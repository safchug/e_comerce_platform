/**
 * Separate from PasswordHasher: refresh tokens are long, high-entropy JWTs,
 * not human passwords, so they need a full-length (not 72-byte-truncated,
 * unlike bcrypt), deterministic hash for exact-match lookups.
 */
export interface TokenHasher {
  hash(token: string): string;
  matches(token: string, hash: string): boolean;
}

export const TOKEN_HASHER = Symbol('TOKEN_HASHER');
