# E-Commerce Platform

A backend e-commerce API built with NestJS, following a hexagonal
(ports & adapters) architecture. This is a learning project — see
[`USER_STORIES.md`](./USER_STORIES.md) for the full backlog and phased plan.

Currently implemented: account registration, login, JWT access/refresh
tokens with rotation, logout, and role-based access control
(customer/admin). The product catalog, cart, checkout, and payment phases
are not built yet.

## Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL via Prisma (driver adapters, `@prisma/adapter-pg`)
- **Cache/session store:** Redis (provisioned via Docker Compose; not yet
  used by the app)
- **Auth:** Passport + `@nestjs/jwt`, bcrypt password hashing, SHA-256
  hashed refresh tokens with rotation
- **Logging:** `nestjs-pino` with request correlation IDs and redaction of
  sensitive headers
- **Testing:** Jest (unit, integration, e2e projects) + Supertest

## Architecture

Each feature lives under `src/modules/<feature>/` and is split into three
layers:

- `domain/` — plain TypeScript entities and business rules, no framework
  imports
- `application/` — use cases and ports (interfaces) that the domain
  depends on
- `infrastructure/` — Nest controllers, guards, Prisma repositories, and
  other adapters that implement those ports

Cross-cutting infrastructure (config, database, logging, security) lives
under `src/infrastructure/`.

## Getting started

### Prerequisites

- Node.js 22+
- Yarn
- Docker (for Postgres/Redis, or run your own local instances)

### Setup

```bash
cp .env.example .env   # adjust values as needed
yarn install
docker compose up -d postgres redis
yarn prisma:migrate
yarn start:dev
```

The app validates its environment on boot (see
`src/infrastructure/config/env.validation.ts`) and refuses to start if
required variables are missing or invalid — in particular `JWT_ACCESS_SECRET`
and `JWT_REFRESH_SECRET` must each be at least 16 characters.

### Running the full stack in Docker

```bash
docker compose up --build
```

This builds the app image, and starts the app, Postgres, and Redis
together.

## Testing

```bash
yarn test            # unit + integration
yarn test:unit        # unit tests only
yarn test:integration # integration tests only
yarn test:cov          # unit + integration, with coverage
yarn test:e2e           # end-to-end tests (needs a running Postgres reachable via DATABASE_URL)
```

## Useful scripts

| Script                | Purpose                                   |
| ---------------------- | ------------------------------------------ |
| `yarn start:dev`       | Run the app in watch mode                  |
| `yarn build`           | Compile to `dist/`                         |
| `yarn lint`            | ESLint (auto-fix)                          |
| `yarn format`          | Prettier (write)                           |
| `yarn prisma:migrate`  | Run Prisma migrations in dev               |
| `yarn prisma:studio`   | Open Prisma Studio                         |

## API surface (current)

| Method | Path            | Auth              | Description                        |
| ------ | --------------- | ----------------- | ----------------------------------- |
| GET    | `/health`       | none               | Liveness check                     |
| POST   | `/auth/register`| none (rate-limited)| Create a customer account          |
| POST   | `/auth/login`   | none (rate-limited)| Exchange credentials for tokens    |
| POST   | `/auth/refresh` | none (rate-limited)| Rotate an access/refresh token pair|
| POST   | `/auth/logout`  | Bearer access token| Revoke the stored refresh token     |
| GET    | `/users/me`     | Bearer access token| Fetch the current user             |
| GET    | `/users`        | Bearer + `ADMIN` role | Placeholder admin-only route    |

## License

UNLICENSED (private learning project).
