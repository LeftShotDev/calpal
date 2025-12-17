# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cal.com is an open-source scheduling infrastructure built as a Yarn/Turbo monorepo. This is a fork focused on custom development and features. The main application is in `apps/web/` with shared packages in `packages/`.

## Technology Stack

- **Framework**: Next.js 13+ (App Router in `apps/web/app/`)
- **Language**: TypeScript 5.9.0-beta (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe APIs
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Monorepo**: Yarn 3.4.1 workspaces with Turbo

## Architecture

### Monorepo Structure

```
apps/
  web/              # Main Next.js application
    app/            # Next.js App Router routes
    pages/          # Legacy Pages Router routes
  api/              # API applications (v1, v2)

packages/
  prisma/           # Database schema (schema.prisma) and migrations
  trpc/             # tRPC API layer
    server/routers/ # API route handlers (viewer, loggedInViewer, publicViewer)
  features/         # Feature-specific code organized by domain
  app-store/        # Third-party integrations (150+ apps)
  ui/               # Shared UI components
  lib/              # Shared utilities
  emails/           # Email templates
```

### Key Architectural Patterns

- **Layered Architecture**: Prisma (data) → Services (business logic) → tRPC (API) → Next.js (UI)
- **Feature Organization**: Domain-driven features in `packages/features/`
- **App Store Pattern**: Plugin-based integrations in `packages/app-store/`
- **Type Safety**: Full stack type safety via tRPC

### Critical Files

- Database schema: `packages/prisma/schema.prisma`
- Main tRPC router: `packages/trpc/server/routers/_app.ts`
- Root layout: `apps/web/app/layout.tsx`
- Translations: `apps/web/public/static/locales/en/common.json`
- Turbo config: `turbo.json`

## Commands

### Development

```bash
# Install dependencies
yarn

# Start dev server (main web app)
yarn dev

# Dev with database setup
yarn dx

# Start specific apps
yarn dev:api         # Web + API
yarn dev:console     # Web + Console
```

### Building

```bash
# Build main web app
yarn build

# Build all packages
turbo run build
```

### Testing

```bash
# Unit tests (always use TZ=UTC for consistency)
TZ=UTC yarn test

# Run specific test file
yarn vitest run path/to/file.test.ts

# Run specific test within file
yarn vitest run path/to/file.test.ts --testNamePattern="test name"

# Integration tests
yarn test path/to/file.integration-test.ts -- --integrationTestsOnly

# E2E tests (Playwright)
PLAYWRIGHT_HEADLESS=1 yarn e2e

# E2E specific file
PLAYWRIGHT_HEADLESS=1 yarn e2e path/to/file.e2e.ts

# E2E specific test
PLAYWRIGHT_HEADLESS=1 yarn e2e path/to/file.e2e.ts --grep "test name"

# Test with UI
yarn test:ui
```

### Code Quality

```bash
# Type checking (CRITICAL: run before committing)
yarn type-check:ci --force

# Lint
yarn lint

# Lint and fix
yarn lint:fix

# Lint with report
yarn lint:report

# Format
yarn format
```

### Database

```bash
# Generate Prisma client (run after schema changes or Node version changes)
yarn prisma generate

# Run migrations (development)
yarn workspace @calcom/prisma db-migrate

# Deploy migrations (production)
yarn workspace @calcom/prisma db-deploy

# Seed database
yarn db-seed

# Open Prisma Studio
yarn db-studio
```

### App Store CLI

```bash
# Create new app
yarn create-app

# Edit existing app
yarn edit-app

# Watch for changes
yarn app-store:watch
```

## Development Guidelines

### Code Style & Best Practices

1. **Type Safety**
   - Never use `as any` - use proper type-safe solutions
   - Use `import type { X }` for TypeScript type imports
   - Import directly from source files, not barrel files:
     - ✅ `@calcom/ui/components/button`
     - ❌ `@calcom/ui`

2. **Prisma Queries**
   - Always use `select` instead of `include` for performance and security
   - Never expose `credential.key` field in API responses
   - Example:
     ```typescript
     // Good
     const booking = await prisma.booking.findFirst({
       select: {
         id: true,
         title: true,
         user: { select: { id: true, name: true } }
       }
     });

     // Bad - fetches all fields including sensitive ones
     const booking = await prisma.booking.findFirst({
       include: { user: true }
     });
     ```

3. **Error Handling**
   - Use early returns to reduce nesting: `if (!booking) return null;`
   - Use `ErrorWithCode` in services/utilities (non-tRPC files)
   - Use `TRPCError` only in tRPC routers
   - Throw descriptive errors with context

4. **Performance**
   - Avoid O(n²) logic in backend code
   - Minimize Day.js usage in performance-critical paths
   - Use `date-fns` or native `Date` when timezone awareness isn't needed

5. **Security**
   - Never commit secrets or API keys
   - Always validate input data
   - Permission checks go in `page.tsx`, never in `layout.tsx`

6. **Internationalization**
   - Add all UI strings to `apps/web/public/static/locales/en/common.json`

### Testing Requirements

- Fix type errors before test failures (they're often the root cause)
- Run `yarn type-check:ci --force` first, then fix tests
- Always use `TZ=UTC` when running tests for consistency
- E2E tests must pass locally before pushing (don't rely on CI)
- Address one failing test file at a time, not all simultaneously

### Workflow

1. **Before Making Changes**
   - Read files before modifying them
   - Understand existing patterns and architecture

2. **After Schema Changes**
   - Run `yarn prisma generate` to update TypeScript types
   - Consider squashing migrations per [Prisma docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/squashing-migrations)

3. **Before Committing**
   - Run `yarn type-check:ci --force` on changed files
   - Run relevant tests
   - Ensure lint passes: `yarn lint:fix`

4. **Pull Requests**
   - Use conventional commits: `feat:`, `fix:`, `refactor:`
   - Create PRs in draft mode by default
   - Keep PRs focused and small (<500 lines, <10 files when possible)
   - Split large changes: Database → Backend → Frontend → Tests

### Never Do

- Modify `*.generated.ts` files directly (created by app-store-cli)
- Put business logic in repositories (belongs in Services)
- Use barrel imports from index.ts files
- Skip type checks before pushing
- Create large monolithic PRs
- Use interactive git commands (`git rebase -i`, `git add -i`)

## Environment Setup

1. Copy `.env.example` to `.env`
2. Generate keys: `openssl rand -base64 32`
   - Set `NEXTAUTH_SECRET`
   - Set `CALENDSO_ENCRYPTION_KEY`
3. Configure PostgreSQL database URL in `DATABASE_URL`
4. Set `DATABASE_DIRECT_URL` to same value as `DATABASE_URL`

### Test Users

When setting up local development database, default users are created with username:password format:
- `free:free`
- `pro:pro`

## Logging

Control logging verbosity with `NEXT_PUBLIC_LOGGER_LEVEL` in .env:
- 0: silly
- 1: trace
- 2: debug
- 3: info (default)
- 4: warn
- 5: error
- 6: fatal

## Additional Documentation

For detailed information, see the `agents/` directory:
- `agents/README.md` - Architecture overview and patterns
- `agents/commands.md` - Complete command reference
- `agents/knowledge-base.md` - Domain knowledge and best practices
- `agents/coding-standards.md` - Coding standards with examples
- `AGENTS.md` - Quick reference guide

## Common Issues

- **Missing enum/type errors**: Run `yarn prisma generate`
- **Enum generator errors**: Run `yarn install` first
- **Timezone test failures**: Always use `TZ=UTC yarn test`
- **Type errors after schema changes**: Run `yarn prisma generate`
- **Type errors after Node version change**: Run `yarn prisma generate`
