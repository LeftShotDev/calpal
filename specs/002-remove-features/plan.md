# Implementation Plan: Remove Routing, Workflows, and Insight Features

**Branch**: `002-remove-features` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-remove-features/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature systematically removes three major feature categories (Routing, Workflows, and Insights) from the Cal.com codebase to create a minimal scheduling application. The removal follows a prioritized approach (P1: Routing, P2: Workflows, P3: Insights) using automated scanning tools with manual verification. All related database tables, UI components, API endpoints, and npm dependencies will be permanently deleted in a single atomic transaction with no rollback capability.

## Technical Context

**Language/Version**: TypeScript 5.9.0-beta (strict mode)
**Primary Dependencies**: Next.js 13+, React 19, Prisma ORM, tRPC, Tailwind CSS
**Storage**: PostgreSQL (with Prisma schema modifications)
**Testing**: Vitest (unit/integration), Playwright (E2E), targeted regression testing
**Target Platform**: Web (Node.js server-side, browser client-side)
**Project Type**: Monorepo (Yarn workspaces + Turbo)
**Performance Goals**: Build succeeds with zero TypeScript errors, all remaining tests pass, 5% startup time improvement
**Constraints**: No rollback mechanism, atomic migration transaction, core scheduling functionality must remain operational
**Scale/Scope**: Large codebase reduction (~33% LOC reduction expected), affects database schema, UI, API, and dependencies across monorepo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Alignment with Constitutional Principles

✅ **Principle VI: Feature Stripping Mandate** - This feature directly implements the constitutional mandate to strip non-essential features from the Cal.com codebase. Routing, Workflows, and Insights are explicitly listed as excluded features in the constitution.

✅ **Principle IV: Maintainable and Minimalistic Code** - Removing these features significantly reduces code complexity, adheres to YAGNI principle, and addresses technical debt by eliminating unnecessary abstractions.

✅ **Principle V: Core Feature Focus** - This removal ensures the application focuses exclusively on core scheduling, calendar integration, and availability management without distraction from advanced features.

✅ **Code Quality Standards** - The plan maintains TypeScript strict mode compliance, ensures zero TypeScript errors post-removal, and requires comprehensive testing of core paths.

✅ **Performance Requirements** - Expected to improve application startup time by 5%, reduce bundle size through dependency removal, and maintain sub-500ms API response times.

### Gate Status: **PASSED**

No constitutional violations detected. This feature is a direct implementation of constitutional principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-remove-features/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── migration.sql    # Database migration contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo structure (Yarn workspaces)
apps/
├── web/                 # Main Next.js application (removal targets: UI components, pages)
└── api/                 # API applications (may contain routing/workflow/insight endpoints)

packages/
├── prisma/              # Database schema (removal target: table definitions, migrations)
│   ├── schema.prisma    # Primary modification point
│   └── migrations/      # New migration to drop tables
├── trpc/                # tRPC API layer (removal targets: routers, handlers)
│   └── server/routers/  # Contains routing/workflow/insight routers
├── features/            # Feature-specific code (removal targets: feature modules)
│   ├── routing/         # TO BE REMOVED
│   ├── workflows/       # TO BE REMOVED
│   └── insights/        # TO BE REMOVED
├── ui/                  # Shared UI components (may contain feature-specific components)
└── app-store/           # Third-party integrations (check for workflow/routing integrations)

tests/
├── integration/         # May contain tests for removed features
└── e2e/                 # Playwright tests (some will be removed)

# Root configuration files affected
package.json             # Dependency removal
turbo.json              # Build configuration cleanup
tsconfig.json           # Type reference cleanup
```

**Structure Decision**: This is a monorepo removal operation affecting multiple workspaces. The primary changes occur in `packages/prisma/` (database), `packages/trpc/` (API), `apps/web/` (UI), and `packages/features/` (feature modules). We will use automated scanning to identify all files within these directories that reference routing, workflows, or insights.

## Complexity Tracking

**No complexity violations identified.** This is a removal/simplification operation that directly reduces complexity in alignment with constitutional principles.

## Phase 0: Research & Discovery

### Research Questions

1. **Feature Location Identification**: Which specific database tables, Prisma models, UI components, tRPC routers, and npm packages belong to routing, workflows, and insights features?

2. **Dependency Graph Analysis**: What are the dependency relationships between these features and core scheduling functionality? Which dependencies can be safely removed?

3. **Foreign Key Constraint Mapping**: Which foreign key constraints exist from core tables to routing/workflow/insight tables that need to be dropped before table removal?

4. **Environment Variable Audit**: Which environment variables in `.env.example`, `.env.appStore.example`, and configuration files reference these features?

5. **Test Coverage Identification**: Which test files in Vitest and Playwright suites specifically cover these features and should be removed?

6. **Migration Transaction Strategy**: What is the correct order of operations for dropping tables with foreign key constraints in a single atomic Prisma migration?

### Research Output

See [research.md](./research.md) for detailed findings on each question.

## Phase 1: Design Artifacts

### Data Model Changes

See [data-model.md](./data-model.md) for:
- Complete list of database tables to be dropped
- Foreign key constraints to be removed
- Migration transaction order
- Before/after schema comparison

### API Contracts

See [contracts/migration.sql](./contracts/migration.sql) for:
- SQL migration script with atomic transaction
- Table drop statements in dependency order
- Foreign key constraint removal
- Rollback prevention measures (commented warnings)

### Developer Quickstart

See [quickstart.md](./quickstart.md) for:
- Step-by-step removal execution guide
- Automated scanning tool commands
- Manual verification checklist
- Regression testing procedures
- Rollback impossibility warnings

## Phase 2: Task Decomposition

**NOT INCLUDED IN THIS PLAN** - Run `/speckit.tasks` to generate detailed task breakdown.

The task generation will decompose this plan into atomic, dependency-ordered tasks covering:
- Feature identification (automated scanning + manual verification)
- Database migration creation and execution
- Code removal (UI, API, feature modules)
- Dependency cleanup (package.json updates)
- Test removal and regression suite execution
- Build verification and performance validation
