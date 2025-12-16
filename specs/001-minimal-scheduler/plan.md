# Implementation Plan: Minimal Scheduling Application

**Branch**: `001-minimal-scheduler` | **Date**: 2025-12-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-minimal-scheduler/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Create a lightweight scheduling application by forking and simplifying the Cal.com codebase. The application will focus exclusively on core scheduling functionality: user booking interface, Google Calendar integration, availability block management, and Google Meet/Zoom video conferencing. All non-essential features will be stripped to achieve a 40%+ bundle size reduction and 50%+ performance improvement while maintaining full scheduling capabilities.

## Technical Context

**Language/Version**: TypeScript 5.9.0-beta (strict mode)
**Primary Dependencies**: Next.js 13+ (App Router), React 19, tRPC, Prisma ORM, Tailwind CSS, NextAuth.js
**Storage**: PostgreSQL with Prisma ORM (existing schema to be simplified)
**Testing**: Vitest (unit tests), Playwright (E2E tests)
**Target Platform**: Web application (browser-based, responsive design)
**Project Type**: Web application (monorepo structure with Yarn workspaces and Turbo)
**Performance Goals**:
- Page load: <1 second for scheduling page (SC-002)
- API responses: <500ms p95 latency (constitution requirement)
- Bundle size: 40%+ reduction from original Cal.com (SC-006)
- Page load performance: 50%+ improvement (SC-007)
**Constraints**:
- Must maintain compatibility with existing Cal.com database schema initially
- Must support timezone conversions automatically
- Must prevent double-booking with real-time updates
- Must optimize backend sync to avoid query loops
**Scale/Scope**:
- Single admin configuration (no multi-user/team support)
- Focus on core scheduling flows only
- Remove all enterprise features, workflows, advanced notifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gates

✅ **I. Streamlined User Experience**: Plan focuses on core scheduling only, removing all non-essential features. UI/UX simplification explicitly called out in requirements.

✅ **II. Essential Integrations Only**: Plan limits integrations to Google Calendar, Google Meet, and Zoom only. All other integrations will be stripped.

✅ **III. Admin Empowerment**: Plan includes admin tools for calendar integration and availability block management with intuitive interfaces.

✅ **IV. Maintainable and Minimalistic Code**: Plan emphasizes code simplification, performance optimization, and removal of redundant patterns. Backend sync optimization addresses query loop issues.

✅ **V. Core Feature Focus**: Plan aligns exactly with constitution's core features: user scheduling, admin calendar integration, Google Meet/Zoom only, admin time blocks.

✅ **VI. Feature Stripping Mandate**: Plan explicitly calls for removing all non-core features from original Cal.com codebase.

**Status**: All gates pass. Proceeding to Phase 0 research.

### Post-Design Gates (After Phase 1)

✅ **I. Streamlined User Experience**: Data model simplified to 5 core entities (Booking, AvailabilityBlock, CalendarIntegration, CalendarEvent, User). API contracts focus on essential operations only. No complex workflows or multi-step processes.

✅ **II. Essential Integrations Only**: Contracts define only Google Calendar, Google Meet, and Zoom endpoints. No other integration endpoints included.

✅ **III. Admin Empowerment**: API provides simple CRUD operations for availability blocks and calendar integration. No complex configuration required.

✅ **IV. Maintainable and Minimalistic Code**: Data model uses standard patterns (Prisma, tRPC). Research identifies optimization strategies (incremental sync, batch processing, proper indexing). No over-engineering.

✅ **V. Core Feature Focus**: Data model and contracts align with core features only. No entities for workflows, payments, teams, or other non-core features.

✅ **VI. Feature Stripping Mandate**: Data model explicitly removes non-core entities (Team, Workflow, Payment, etc.). Contracts exclude non-core endpoints.

**Status**: All gates pass. Design is constitution-compliant. Ready for implementation planning (Phase 2).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/                          # Main Next.js application
├── app/                          # Next.js App Router pages
│   ├── (use-page-wrapper)/      # Public scheduling pages
│   │   └── [username]/          # User-facing booking pages
│   └── (use-page-wrapper)/(main-nav)/  # Admin pages
│       ├── settings/            # Admin settings
│       │   ├── availability/     # Availability block management
│       │   └── integrations/    # Calendar integration settings
│       └── bookings/            # Booking management
├── components/                  # Page-specific components
└── lib/                         # App-specific utilities

packages/prisma/                  # Database schema and migrations
├── schema.prisma                # Simplified schema (remove non-core entities)
└── migrations/                  # Database migrations

packages/trpc/                    # tRPC API layer
└── server/
    └── routers/
        ├── availability/        # Availability block endpoints
        ├── bookings/            # Booking endpoints
        ├── calendar/            # Calendar integration endpoints
        └── video/               # Video conferencing endpoints

packages/ui/                      # Shared UI components
└── components/
    ├── booking/                 # Booking form components
    ├── availability/             # Availability display components
    └── calendar/               # Calendar integration UI

packages/features/                # Feature-specific code
├── availability/                # Availability block logic
├── bookings/                    # Booking management logic
├── calendar/                    # Calendar sync logic
└── video/                        # Video conferencing logic

packages/lib/                     # Shared utilities
├── timezone/                     # Timezone conversion utilities
└── calendar/                     # Calendar API clients

tests/
├── integration/                 # Integration tests
│   ├── booking-flow.test.ts     # End-to-end booking tests
│   └── calendar-sync.test.ts    # Calendar sync tests
└── unit/                         # Unit tests
    └── [feature]/               # Feature-specific unit tests
```

**Structure Decision**: Using existing Cal.com monorepo structure (Yarn workspaces + Turbo). The application is a web-based scheduling system, so we maintain the Next.js frontend + tRPC backend architecture. Code will be organized by feature domains (availability, bookings, calendar, video) within the existing package structure. Non-core packages will be removed or stripped down.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. The plan maintains the existing monorepo structure but simplifies it by removing non-core features. This approach is justified because:
1. Forking from Cal.com requires maintaining compatibility with existing infrastructure initially
2. Monorepo structure enables code sharing between frontend and backend (tRPC, Prisma, UI components)
3. Gradual simplification is safer than complete rewrite
4. Existing tooling (Turbo, Yarn workspaces) provides build optimization benefits
