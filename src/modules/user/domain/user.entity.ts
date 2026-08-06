import { UserRole } from './user-role.enum';

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Plain domain entity: no framework or persistence concerns. */
export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get refreshTokenHash(): string | null {
    return this.props.refreshTokenHash;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  withRefreshTokenHash(refreshTokenHash: string | null): User {
    return new User({ ...this.props, refreshTokenHash });
  }
}
