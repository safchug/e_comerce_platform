export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`An account with email "${email}" already exists`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

/** Deliberately generic message: avoids leaking whether the email exists (OWASP A07). */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
    this.name = 'InvalidCredentialsError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid or expired refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}
