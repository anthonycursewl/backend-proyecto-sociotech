# Repository Knowledge for OpenCode

## Project Overview
NestJS-based Node.js backend application with PostgreSQL, Prisma ORM, JWT authentication, and modular architecture.

## Key Architecture
- **Monorepo-style**: Modular structure under `src/modules/` (identity, clinical, scheduling, shared)
- **Entry point**: `src/main.ts` - loads dotenv, creates NestFactory, configures ValidationPipe and global exception filter
- **AppModule** (`src/app.module.ts`) orchestrates all modules: PrismaModule, IdentityModule, ClinicalModule, SchedulingModule, SharedModule

## Developer Commands
- `npm install` - Install dependencies
- `npm run start` - Start production server
- `npm run start:dev` - Start in watch mode (development)
- `npm run build` - Build the project
- `npm run test` - Run unit tests (Jest)
- `npm run test:cov` - Run tests with coverage
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma client
- `npm run seed:admin` - Create super admin user (run after migrations)
- `npm run seed:system` - Seed system data (run after migrations)

## Database & ORM
- **Prisma** as ORM with PostgreSQL (`prisma/schema.prisma`)
- **Migrations**: stored in `prisma/migrations/`
- **Config**: `prisma.config.ts` defines schema path and datasource URL from `DATABASE_URL` env var
- **Prisma client**: auto-generated, used throughout modules via `PrismaModule`

## Security & Auth
- **JWT-based auth**: `@nestjs/jwt`, secret from `JWT_SECRET` env var (falls back to `'your-secret-key-change-in-production'`)
- **Password hashing**: bcrypt via `BcryptAuthService`
- **Guards**: `RolesGuard` for role-based access, `AuthGuard('jwt')` for protected routes
- **Env files**: `.env`, `.env.development.local`, `.env.test.local`, `.env.production.local`, `.env.local` - all ignored in git
- **Default port**: 5002 (from `main.ts`)

## Testing
- **Framework**: Jest (`ts-jest`)
- **Test files**: `*.spec.ts` pattern
- **Unit tests**: `npm run test`
- **E2E tests**: `npm run test:e2e` (configured in `test/jest-e2e.json`)
- **Coverage**: `npm run test:cov` outputs to `../coverage/`

## Linting & Formatting
- **ESLint**: configured in `eslint.config.mjs` with TypeScript, Jest globals, prettier rules
- **Prettier**: `.prettierrc` config; format command: `npm run format`
- **Rules**: `@typescript-eslint/no-floating-promises` warn, prettier errors for endOfLine

## Module Patterns
- Each module has: `application/use-cases`, `domain/entities/ports`, `infrastructure/repositories`, `infrastructure/strategies/controllers`
- **Ports/interfaces** pattern used for repository abstraction (e.g., `USER_REPOSITORY`, `AUTH_SERVICE`, `AUDIT_REPOSITORY`)
- **Dependency injection**: constructor-based with `@Inject()` for interface bindings

## Environment
- **Node.js** with TypeScript
- Global `dotenv` config in `main.ts` (loads before anything else)
- `NODE_ENV` not explicitly used; relies on env file loading order
- `.env` files are **gitignored** - secrets never committed

## Important Conventions
- **Command order**: `lint -> typecheck -> test` not enforced but recommended
- **Role immutability**: `IMMUTABLE_ROLES` (likely admin/super) cannot be changed via API
- **Self-deactivation guard**: Cannot deactivate own account
- **Role assignment guard**: Only users with `Permission.USER_ASSIGN_ROLE` can assign roles

## Dependencies Highlights
- `@prisma/adapter-pg`, `@prisma/client` - PostgreSQL adapter
- `@nestjs/passport`, `passport-jwt` - JWT strategy
- `class-validator`, `class-transformer` - DTO validation/transformation
- `pdfkit` - PDF generation (used in some services)