# Learning Project: E-Commerce Platform — Product Backlog

**Stack:** Node.js + TypeScript, using the **NestJS** framework
**Goal:** Build a solid, production-grade e-commerce backend (with a thin frontend/API-consumer if you want) while deliberately practicing clean architecture, design patterns, testing, and DevOps.
**How to use this doc:** Work top to bottom. Each phase builds on the last. Don't skip Phase 0 — it's where most engineers under-invest, and it's where most of the "become a better engineer" value lives. Check off stories as you complete them, and jot down what you learned under each one.

---

## Product Description

**What it is:** A backend e-commerce platform that lets shoppers browse a product catalog, manage a cart, and complete a purchase (checkout + payment), while admins manage products and inventory.

**Who it's for:**

- **Shoppers** — browse/search products, manage a cart, place and track orders.
- **Admins** — manage the product catalog, monitor inventory, view orders.
- **You (the developer)** — the primary "user" of this project in a learning sense: it exists as a vehicle to practice clean architecture, testing, security, and operational maturity on a realistic, non-trivial domain.

**Core capabilities (delivered progressively across the phases below):**

- Account registration, authentication, and role-based access (customer/admin).
- Product catalog with browsing, search, filtering, and pagination.
- Shopping cart with accurate pricing/tax calculation.
- Order placement with a well-defined lifecycle (Pending → Paid → Shipped → Delivered/Cancelled).
- Inventory tracking with stock reservation to prevent overselling.
- Payment processing via a pluggable payment gateway (sandbox/mock first).
- Production-grade non-functional qualities: automated testing, observability (logs/metrics/tracing), resilience (retries/circuit breakers/rate limiting), and security hardening (OWASP-aligned).
- CI/CD pipeline and a deployable, horizontally scalable system.

**Why e-commerce as the learning vehicle:** it has a rich, realistic domain (money, inventory, state machines, third-party integrations, concurrency) that naturally forces you to practice the architecture and engineering skills listed in the goal above, without needing an artificially inflated scope.

---

## Phase 0 — Foundations & Architecture Skeleton

> Goal: a running, empty-but-correct system before writing any business logic.

### Epic 0.1 — Project Setup

- [x] **US-001**: As a developer, I want a NestJS project scaffolded via the Nest CLI with strict TypeScript, ESLint, and Prettier configured, so that I get a convention-based foundation and catch bugs early.
  - AC: `nest new` project builds and runs (`npm run start:dev`); `tsconfig.json` has `strict: true`; `npm run lint` and `npm run build` both pass in CI.
  - Learn: Nest CLI project conventions, decorator/metadata-driven design, strict typing discipline.
- [x] **US-002**: As a developer, I want my core business/domain logic organized as plain, decorator-free TypeScript classes inside feature modules, so that my domain rules don't depend on the Nest framework.
  - AC: Directory layout keeps `domain/` (entities, value objects, business rules — no Nest imports) separate from `application/` (use cases/services) and `infrastructure/` (Nest controllers, providers, ORM, adapters), organized under per-feature modules in `src/modules/*`.
  - Learn: Clean Architecture / Hexagonal (Ports & Adapters) pattern applied inside a framework, keeping the domain testable in isolation from Nest.
- [x] **US-003**: As a developer, I want to use Nest's built-in DI container correctly (constructor injection, custom providers, injection tokens for interfaces), so that components stay testable and swappable without manual wiring.
  - AC: At least one dependency is bound via a custom provider/injection token (e.g. an abstract `ProductRepository` interface bound to a Postgres implementation); modules declare explicit `providers`/`exports`.
  - Learn: Nest's DI container, provider scopes, binding interfaces to implementations (Nest's take on Dependency Inversion).
- [ ] **US-004**: As a developer, I want a Dockerized local dev environment (Nest app + Postgres + Redis) with hot reload, so that setup is reproducible.
  - AC: `docker-compose up` starts the Nest API (watch mode), DB, and cache with one command.
  - Learn: containerizing a Nest app, 12-factor app config via env vars.
  - Status: Postgres/Redis containers and a working _production_ image build are done; `docker-compose.yml` still only targets the `production` stage, so there's no watch-mode dev container yet. Fixed the broken production build (missing `--ignore-scripts` on the prod-only install stage) but didn't add a dev target — still open.
- [x] **US-005**: As a developer, I want centralized configuration using Nest's `ConfigModule` with schema validation, so that misconfiguration fails fast at startup.
  - AC: App refuses to boot if required env vars are missing/invalid, using `ConfigModule.forRoot({ validationSchema })` (Joi or a Zod-based adapter).
  - Learn: Nest `ConfigModule`, fail-fast validation, global vs. feature-scoped modules.

### Epic 0.2 — Quality Gates

- [x] **US-006**: As a developer, I want a test framework set up (unit + integration) with a coverage threshold, so that regressions are caught automatically.
  - AC: `npm test` runs unit + integration suites; CI fails under e.g. 70% coverage on core domain.
  - Learn: testing pyramid, unit vs integration vs e2e boundaries.
- [x] **US-007**: As a developer, I want a CI pipeline (GitHub Actions) that lints, builds, and tests every PR, so that broken code never reaches main.
  - AC: PRs show pass/fail checks; merging is blocked on failure.
  - Learn: CI fundamentals, trunk-based development basics.
  - Status: the `test` job was previously unrunnable in CI (no Postgres/Redis service containers, no `JWT_*` secrets in the job env, migrations never applied) — fixed by adding service containers, env vars, and a `prisma migrate deploy` step.
- [x] **US-008**: As a developer, I want structured logging and a request-scoped logger, so that I can trace what happened without `console.log`.
  - AC: Every request logs a correlation/request ID; logs are JSON-structured (e.g. `pino`).
  - Learn: observability basics, structured logging.

---

## Phase 1 — Core Domain: Users & Catalog (MVP)

> Goal: first real vertical slice, end-to-end, through all layers.

### Epic 1.1 — Authentication & Users

- [x] **US-010**: As a guest, I want to register with email/password, so that I can create an account.
  - AC: Passwords hashed with bcrypt/argon2; duplicate email rejected with clear error; input validated at the boundary (DTO).
  - Learn: password hashing, input validation, DTO vs domain model separation.
  - Status: email is now trimmed/lowercased at the DTO boundary — the unique constraint was case-sensitive (`User@x.com` and `user@x.com` could both register) before this fix.
- [x] **US-011**: As a registered user, I want to log in and receive a token, so that I can access protected resources.
  - AC: JWT (or session) issued on success; invalid credentials return generic error (no user enumeration).
  - Learn: authN vs authZ, JWT vs session tradeoffs, OWASP A07 (auth failures).
- [x] **US-012**: As a user, I want my session to expire and be refreshable, so that stolen tokens have limited value.
  - AC: Access token short-lived; refresh token rotation implemented; revocation possible.
  - Learn: token lifecycle, refresh token rotation, security tradeoffs.
- [x] **US-013**: As an authenticated user, I want role-based access (customer vs admin), so that only authorized users can manage the catalog.
  - AC: Middleware enforces role checks; unauthorized access returns 403, not 500.
  - Learn: RBAC, middleware/interceptor pattern.

### Epic 1.2 — Product Catalog

- [x] **US-014**: As an admin, I want to create/update/delete products, so that the catalog stays current.
  - AC: CRUD endpoints behind admin auth; domain validation (price > 0, SKU unique) enforced in the domain layer, not just DB constraints.
  - Learn: where validation belongs (domain vs infra), repository pattern.
- [x] **US-015**: As a shopper, I want to browse products with pagination, so that large catalogs load quickly.
  - AC: Cursor or offset pagination; response includes total/next-page metadata.
  - Learn: pagination patterns, N+1 query avoidance.
- [x] **US-016**: As a shopper, I want to search/filter products by name, category, and price range, so that I can find what I want.
  - AC: Query supports combined filters; indexed columns used for filters.
  - Learn: query optimization, DB indexing.
  - Status: added `category` to the `Product` model (backfilled existing rows via migration default, then dropped the default so it's required going forward). `GET /products` now takes optional `name`/`category`/`minPriceCents`/`maxPriceCents`, all combinable. Indexed for the access patterns that matter: a GIN `pg_trgm` index on `name` for case-insensitive substring search (plain btree can't serve `ILIKE '%x%'`), a composite btree on `(category, priceCents)` for category-only and category+price queries, and a standalone btree on `priceCents` for price-only range queries. Verified with `EXPLAIN` against a 20k-row seed that the composite and price indexes get picked up automatically; the trigram index only wins the planner's cost comparison once substring matches are rare enough (confirmed it's usable via `SET enable_seqscan = off`) — a good reminder that index existence isn't the same as index usage, the planner still chooses based on selectivity/cost.
- [x] **US-017**: As a developer, I want the product repository abstracted behind an interface, so that I can swap Postgres for another store without touching business logic.
  - AC: `ProductRepository` interface in domain layer; Postgres implementation in infrastructure layer; a fake in-memory implementation used in tests.
  - Learn: Repository pattern, testing against interfaces not implementations.

---

## Phase 2 — Core Commerce Flow

> Goal: the "money" path — cart, order, checkout, payment, inventory.

### Epic 2.1 — Shopping Cart

- [x] **US-020**: As a shopper, I want to add/remove items from a cart, so that I can collect items before purchasing.
  - AC: Cart persists across sessions (DB or Redis-backed); quantity updates validated against stock.
  - Learn: state management choices (stateless API + persisted cart), idempotency.
- [x] **US-021**: As a shopper, I want my cart total (with tax rules) calculated correctly, so that I know what I'll pay.
  - AC: Pricing/tax logic isolated in a domain service, unit-tested with edge cases (0 items, discounts, rounding).
  - Learn: domain services vs anemic models, floating point money pitfalls (use integer cents).
  - Status: added `CartPricingService` (`src/modules/cart/domain/cart-pricing.service.ts`) - a pure, Nest-free domain service that turns priced lines into subtotal/discount/tax/total using `Money` (integer cents throughout, `Math.round` at every multiply so nothing drifts to floating point). Supports an optional percentage or fixed discount (clamped so it can never exceed the subtotal) and a configurable flat tax rate (`TAX_RATE` env var, applied to the post-discount amount). The Cart entity itself still only tracks productId/quantity - a new `ResolveCartTotalsUseCase` in the application layer is the one doing I/O (fetching current prices from `ProductRepository`) and handing plain `Money` values to the domain service, which is what keeps the pricing math unit-testable with a fake repository instead of a real DB. `GET/POST/PATCH /cart` now return `subtotalCents`/`discountCents`/`taxCents`/`totalCents`/`taxRate` plus a per-line `unitPriceCents`/`lineTotalCents`. Edge cases covered in `cart-pricing.service.spec.ts`: empty cart, discount larger than the subtotal, percentage/fixed discounts, and tax/discount rounding (e.g. 999¢ × 8.25% = 82.4175 → 82¢).

### Epic 2.2 — Orders & Checkout

- [ ] **US-022**: As a shopper, I want to place an order from my cart, so that I can purchase items.
  - AC: Order creation is a single transaction (cart → order → stock decrement) — all-or-nothing.
  - Learn: transactional boundaries, unit of work pattern.
- [ ] **US-023**: As the system, I want order state to move through a defined lifecycle (Pending → Paid → Shipped → Delivered/Cancelled), so that invalid transitions are impossible.
  - AC: Illegal transitions (e.g. Delivered → Pending) throw a domain error.
  - Learn: State pattern / finite state machines for domain modeling.
- [ ] **US-024**: As a shopper, I want to cancel an order before it ships, so that I'm not charged for mistakes.
  - AC: Cancellation reverses stock reservation; not allowed after "Shipped".
  - Learn: compensating actions, saga-lite thinking.

### Epic 2.3 — Inventory

- [ ] **US-025**: As the system, I want stock reservations during checkout to prevent overselling, so that two customers can't buy the last item.
  - AC: Concurrent checkout test (two simultaneous requests for last unit) — only one succeeds.
  - Learn: race conditions, optimistic vs pessimistic locking, DB row locks/transactions.
- [ ] **US-026**: As an admin, I want low-stock alerts, so that I can restock in time.
  - AC: Event emitted when stock < threshold; consumed by a notification handler.
  - Learn: domain events, event-driven decoupling.

### Epic 2.4 — Payments

- [ ] **US-027**: As a shopper, I want to pay via a payment provider (start with a mock/sandbox, e.g. Stripe test mode), so that checkout completes securely.
  - AC: Payment logic behind a `PaymentGateway` interface; webhook signature verified.
  - Learn: adapter pattern for 3rd-party integrations, webhook security (signature validation), idempotency keys.
- [ ] **US-028**: As the system, I want failed payments to roll back the order/stock changes, so that data stays consistent.
  - AC: Failure path tested explicitly (simulate provider timeout/decline).
  - Learn: compensating transactions, resilience to partial failure.

---

## Phase 3 — Hardening & Craft

> Goal: turn "it works" into "it's solid." This phase is where most growth as an engineer happens.

### Epic 3.1 — Testing Depth

- [ ] **US-030**: As a developer, I want unit tests for all domain logic (pricing, state transitions, validation) with no DB/network dependency, so that the core is provably correct and fast to test.
  - AC: Domain layer test suite runs in <2s, zero I/O.
- [ ] **US-031**: As a developer, I want integration tests against a real (containerized) Postgres, so that repository/query logic is verified against real SQL semantics.
  - AC: Testcontainers or docker-compose-based test DB spins up in CI.
- [ ] **US-032**: As a developer, I want end-to-end tests for the critical path (register → browse → cart → checkout → pay), so that regressions in the money path are caught before release.
- [ ] **US-033**: As a developer, I want contract tests around the payment gateway adapter, so that provider API changes are caught early.
  - Learn: contract testing, testing at boundaries.

### Epic 3.2 — Resilience & Observability

- [ ] **US-034**: As an operator, I want health-check and readiness endpoints, so that orchestration tools know when the app is safe to route traffic to.
  - Status: a basic liveness endpoint (`GET /health`) now exists; a real readiness check (e.g. verifying the DB/Redis connections) is still open.
- [ ] **US-035**: As an operator, I want metrics (request latency, error rate, order throughput) exposed (e.g. Prometheus format), so that I can monitor system health.
- [ ] **US-036**: As an operator, I want distributed tracing across the checkout flow, so that I can debug slow/failing requests across services.
- [ ] **US-037**: As a developer, I want retries with backoff and circuit breakers around the payment provider call, so that transient failures don't cascade.
  - Learn: resilience patterns (retry, circuit breaker, timeout).
- [ ] **US-038**: As a developer, I want rate limiting on public endpoints (login, checkout), so that the system is protected from abuse.
  - Learn: OWASP API security, token bucket/leaky bucket algorithms.
  - Status: added an in-memory, per-process fixed-window limiter (`RateLimitGuard`) applied globally, with a tighter limit on `/auth/*`. It's dependency-free (no npm registry access when this was written) and single-instance only — swap for `@nestjs/throttler` + a Redis store before running more than one instance.

### Epic 3.3 — Security Pass

- [ ] **US-039**: As a security-conscious developer, I want an OWASP Top 10 review of auth, input handling, and dependency vulnerabilities, so that known classes of bugs are eliminated.
  - AC: `npm audit`/Dependabot clean; SQL uses parameterized queries only; all inputs validated at API boundary.
- [ ] **US-040**: As a developer, I want secrets (DB creds, API keys) managed outside source control (e.g. `.env` + secret manager in prod), so that credentials never leak.

---

## Phase 4 — Deployment & Scale (Stretch)

> Goal: experience the operational side of "real" software.

- [ ] **US-041**: As a developer, I want a CD pipeline that deploys on merge to main (to a free-tier cloud host), so that I experience the full delivery loop.
- [ ] **US-042**: As an operator, I want the app horizontally scalable (stateless app servers, shared DB/cache), so that it can handle more load.
- [ ] **US-043**: As a developer, I want a caching layer (Redis) for hot product/catalog reads, so that read-heavy endpoints scale without hammering the DB.
- [ ] **US-044**: As a developer, I want a basic load test (k6/Artillery) on the checkout flow, so that I know the system's real capacity and bottlenecks.
- [ ] **US-045**: As a developer, I want an API gateway or BFF layer in front of the services, so that I understand how larger systems compose (optional: split catalog/orders into separate services to practice microservice boundaries).

---

## Suggested Order of Attack

1. Phase 0 completely (don't skip — it's the multiplier for everything after).
2. Phase 1 epics in order (Auth → Catalog).
3. Phase 2 epics in order (Cart → Orders → Inventory → Payments) — this is the hardest and most valuable phase for architecture skills.
4. Phase 3 continuously, retrofitted as you go (don't wait until the end to write tests).
5. Phase 4 once the core is solid, for operational experience.

## How to track learning (recommended habit)

For each story, before marking it done, write 2-3 lines under it:

- What pattern/concept did I apply?
- What would I do differently next time?
- What tradeoff did I make and why?

This turns the backlog into both a build plan and a personal engineering journal.
