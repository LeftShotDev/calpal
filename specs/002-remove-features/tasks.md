# Tasks: Remove Routing, Workflows, and Insight Features

**Input**: Design documents from `/specs/002-remove-features/`
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: No dedicated test tasks - verification happens through regression testing after each user story

**Organization**: Tasks are grouped by user story (P1: Routing, P2: Workflows, P3: Insights) to enable independent implementation and testing of each removal.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Monorepo structure (Yarn workspaces + Turbo):
- **Database**: `packages/prisma/`
- **API**: `packages/trpc/`, `apps/api/`
- **UI**: `apps/web/`
- **Features**: `packages/features/`, `packages/app-store/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare environment and create automation tools for feature removal

- [ ] T001 Create backup of current database schema in specs/002-remove-features/backup/schema.prisma
- [ ] T002 Document current package.json dependency count for comparison (create specs/002-remove-features/metrics-before.json)
- [ ] T003 [P] Create automated file finder script in specs/002-remove-features/scripts/find-routing-files.sh
- [ ] T004 [P] Create automated file finder script in specs/002-remove-features/scripts/find-workflow-files.sh
- [ ] T005 [P] Create automated file finder script in specs/002-remove-features/scripts/find-insights-files.sh
- [ ] T006 Run baseline TypeScript compilation to capture current error count (tsc --noEmit > specs/002-remove-features/tsc-errors-before.txt)
- [ ] T007 Run baseline test suite to capture passing test count (yarn test > specs/002-remove-features/test-results-before.txt)

---

## Phase 2: Foundational (Database Migration Preparation)

**Purpose**: Create database migration that will drop all tables - BLOCKS all code removal

**⚠️ CRITICAL**: Database migration must be created first to understand FK dependencies

- [ ] T008 Create Prisma migration file in packages/prisma/migrations/[timestamp]_remove_routing_workflows_insights/migration.sql
- [ ] T009 Add Phase 1 SQL to migration: Drop WorkflowsOnEventTypes, WorkflowsOnTeams, WorkflowsOnRoutingForms junction tables
- [ ] T010 Add Phase 1 SQL to migration: ALTER TABLE Booking DROP COLUMN workflowReminders
- [ ] T011 Add Phase 1 SQL to migration: ALTER TABLE BookingAudit DROP COLUMN workflowReminderId
- [ ] T012 Add Phase 1 SQL to migration: Drop WorkflowReminder, WorkflowOptOutContact, WorkflowStep, AIPhoneCallConfiguration, WebhookScheduledTriggers, Workflow tables
- [ ] T013 Add Phase 2 SQL to migration: Drop routing form views (RoutingFormResponse, RoutingFormResponseDenormalized)
- [ ] T014 Add Phase 2 SQL to migration: Drop RoutingFormResponseField, App_RoutingForms_QueuedFormResponse, App_RoutingForms_FormResponse tables
- [ ] T015 Add Phase 2 SQL to migration: Drop App_RoutingForms_IncompleteBookingActions, App_RoutingForms_Form tables
- [ ] T016 Add Phase 2 SQL to migration: Drop AttributeToUser, AttributeOption, Attribute tables
- [ ] T017 Add Phase 3 SQL to migration: Drop FilterSegment, WatchlistEventAudit, BookingAudit, BookingReport tables
- [ ] T018 Add enum cleanup SQL to migration: Rename workflow enums to _old versions
- [ ] T019 Wrap entire migration in BEGIN/COMMIT transaction block with warning comments
- [ ] T020 Update packages/prisma/schema.prisma to remove all workflow model definitions
- [ ] T021 Update packages/prisma/schema.prisma to remove all routing form model definitions
- [ ] T022 Update packages/prisma/schema.prisma to remove all insights model definitions
- [ ] T023 Update packages/prisma/schema.prisma to remove all related enum definitions
- [ ] T024 Remove workflowReminders field from Booking model in schema.prisma
- [ ] T025 Remove workflowReminderId field from BookingAudit model in schema.prisma
- [ ] T026 Run prisma format to validate schema syntax (yarn prisma format)
- [ ] T027 Generate Prisma client with new schema (yarn prisma generate)

**Checkpoint**: Migration ready - code removal can now proceed in parallel by feature

---

## Phase 3: User Story 1 - Remove Routing Feature (Priority: P1) 🎯 MVP

**Goal**: Remove all routing-related code, reducing codebase by ~130 files and 10% LOC

**Independent Test**: Application builds successfully, all routing URLs return 404, core scheduling works

### Remove Routing Database Code

- [ ] T028 [P] [US1] Remove packages/prisma/zod/modelSchema/App_RoutingForms_FormSchema.ts
- [ ] T029 [P] [US1] Remove packages/prisma/zod/modelSchema/App_RoutingForms_FormResponseSchema.ts
- [ ] T030 [P] [US1] Remove packages/prisma/zod/modelSchema/App_RoutingForms_QueuedFormResponseSchema.ts
- [ ] T031 [P] [US1] Remove packages/prisma/zod/modelSchema/RoutingFormResponseFieldSchema.ts
- [ ] T032 [P] [US1] Remove packages/prisma/zod/modelSchema/RoutingFormResponseDenormalizedSchema.ts
- [ ] T033 [P] [US1] Remove packages/prisma/zod/modelSchema/RoutingFormResponseSchema.ts
- [ ] T034 [P] [US1] Remove packages/prisma/zod/modelSchema/App_RoutingForms_IncompleteBookingActionsSchema.ts
- [ ] T035 [P] [US1] Remove packages/prisma/zod/modelSchema/WorkflowsOnRoutingFormsSchema.ts

### Remove Routing tRPC Routers

- [ ] T036 [P] [US1] Remove packages/trpc/server/routers/apps/routing-forms/ directory (8 handlers)
- [ ] T037 [P] [US1] Remove packages/trpc/server/routers/viewer/routing-forms/ directory (2 handlers)
- [ ] T038 [US1] Remove routing-forms router imports from packages/trpc/server/routers/apps/_router.ts
- [ ] T039 [US1] Remove routing-forms router imports from packages/trpc/server/routers/viewer/_router.tsx

### Remove Routing Feature Modules

- [ ] T040 [US1] Remove packages/app-store/routing-forms/ directory (100+ files)
- [ ] T041 [P] [US1] Remove packages/features/routing-forms/ directory
- [ ] T042 [P] [US1] Remove packages/lib/raqb/ directory (React Awesome Query Builder)
- [ ] T043 [P] [US1] Remove packages/app-store/_utils/raqb/ directory

### Remove Routing UI Components

- [ ] T044 [P] [US1] Remove apps/web/app/(use-page-wrapper)/apps/routing-forms/ directory (admin pages)
- [ ] T045 [P] [US1] Remove apps/web/components/apps/routing-forms/ directory (components)
- [ ] T046 [P] [US1] Remove apps/web/app/routing-forms/ directory (public pages)
- [ ] T047 [P] [US1] Remove apps/web/components/dialog/RerouteDialog.tsx
- [ ] T048 [P] [US1] Remove apps/web/lib/apps/routing-forms/ directory (server-side props)

### Remove Routing API Routes

- [ ] T049 [P] [US1] Remove apps/web/app/api/routing-forms/ directory
- [ ] T050 [P] [US1] Remove apps/web/pages/api/routing-forms/[trpc].ts
- [ ] T051 [P] [US1] Remove apps/web/pages/api/trpc/appRoutingForms/[trpc].ts

### Remove Routing Tests

- [ ] T052 [P] [US1] Remove apps/web/playwright/insights-routing.e2e.ts
- [ ] T053 [P] [US1] Remove apps/web/playwright/insights-routing-filters.e2e.ts
- [ ] T054 [P] [US1] Remove apps/web/playwright/i18n-routing.e2e.ts
- [ ] T055 [P] [US1] Remove apps/web/playwright/lib/test-helpers/routingFormHelpers.ts
- [ ] T056 [P] [US1] Remove apps/web/playwright/fixtures/routingForms.ts
- [ ] T057 [P] [US1] Find and remove all __tests__ directories in routing packages using find command

### Remove Routing Insights Components

- [ ] T058 [P] [US1] Remove packages/features/insights/components/routing/ directory (6 components)
- [ ] T059 [P] [US1] Remove apps/web/app/(use-page-wrapper)/insights/routing/ directory

### Remove Routing Dependencies

- [ ] T060 [US1] Remove "react-awesome-query-builder": "^5.1.2" from package.json
- [ ] T061 [US1] Remove "json-logic-js": "^2.0.2" from package.json
- [ ] T062 [US1] Run yarn install to update lockfile

### Validate Routing Removal

- [ ] T063 [US1] Search codebase for remaining "routing" references (grep -r "routing" --exclude-dir=node_modules --exclude-dir=.next)
- [ ] T064 [US1] Search codebase for remaining "RoutingForm" references (grep -r "RoutingForm" --exclude-dir=node_modules --exclude-dir=.next)
- [ ] T065 [US1] Run TypeScript compilation and capture errors (tsc --noEmit > specs/002-remove-features/tsc-errors-us1.txt)
- [ ] T066 [US1] Fix TypeScript errors related to routing imports/types
- [ ] T067 [US1] Run build to verify no routing routes remain (yarn build)
- [ ] T068 [US1] Test core scheduling functionality (create booking, check availability)

**Checkpoint**: Routing feature completely removed, application builds successfully

---

## Phase 4: User Story 2 - Remove Workflows Feature (Priority: P2)

**Goal**: Remove all workflow-related code, reducing codebase by ~150 files and 15% LOC

**Independent Test**: Application builds, no workflow UI accessible, core scheduling + routing removal works

### Remove Workflows Database Code

- [ ] T069 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowSchema.ts
- [ ] T070 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowStepSchema.ts
- [ ] T071 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowReminderSchema.ts
- [ ] T072 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowOptOutContactSchema.ts
- [ ] T073 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowsOnEventTypesSchema.ts
- [ ] T074 [P] [US2] Remove packages/prisma/zod/modelSchema/WorkflowsOnTeamsSchema.ts
- [ ] T075 [P] [US2] Remove packages/prisma/zod/modelSchema/WebhookScheduledTriggersSchema.ts
- [ ] T076 [P] [US2] Remove packages/prisma/zod/modelSchema/AIPhoneCallConfigurationSchema.ts

### Remove Workflows tRPC Routers

- [ ] T077 [US2] Remove packages/trpc/server/routers/viewer/workflows/ directory (14 handlers)
- [ ] T078 [US2] Remove workflows router imports from packages/trpc/server/routers/viewer/_router.tsx

### Remove Workflows Feature Modules

- [ ] T079 [US2] Remove packages/features/ee/workflows/ directory (150+ files: components, services, repositories, pages)
- [ ] T080 [P] [US2] Remove packages/lib/tasker/Tasker.ts
- [ ] T081 [P] [US2] Remove packages/lib/triggerDevLogger.ts
- [ ] T082 [P] [US2] Remove packages/features/bookings/lib/tasker/trigger/ directory
- [ ] T083 [P] [US2] Remove packages/features/trigger.config.ts

### Remove Workflows UI Pages

- [ ] T084 [P] [US2] Remove apps/web/app/(use-page-wrapper)/workflows/ directory
- [ ] T085 [P] [US2] Remove apps/web/app/(use-page-wrapper)/workflows/[workflow]/ directory

### Remove Workflows API Routes

- [ ] T086 [P] [US2] Remove apps/web/app/api/cron/workflows/ directory (3 cron jobs)
- [ ] T087 [P] [US2] Remove apps/web/app/api/workflows/sms/user-response/route.ts
- [ ] T088 [P] [US2] Remove apps/web/pages/api/trpc/workflows/[trpc].ts

### Remove Workflows Email Templates

- [ ] T089 [P] [US2] Remove packages/emails/templates/workflow-email.ts
- [ ] T090 [P] [US2] Remove packages/emails/workflow-email-service.ts

### Remove Workflows API V2 Module

- [ ] T091 [US2] Remove apps/api/v2/src/modules/workflows/ directory (entire Nest.js module)
- [ ] T092 [US2] Remove apps/api/v2/src/modules/organizations/teams/workflows/ directory
- [ ] T093 [US2] Remove workflows imports from apps/api/v2/src/modules/organizations/teams/teams.module.ts
- [ ] T094 [P] [US2] Remove apps/api/v2/src/modules/auth/guards/workflows/ directory
- [ ] T095 [P] [US2] Remove apps/api/v2/test/fixtures/repository/workflow.repository.fixture.ts
- [ ] T096 [P] [US2] Remove apps/api/v2/test/fixtures/repository/workflow-reminder.repository.fixture.ts

### Remove Workflows Tests

- [ ] T097 [P] [US2] Remove apps/web/playwright/workflow.e2e.ts
- [ ] T098 [P] [US2] Remove apps/web/playwright/fixtures/workflows.ts
- [ ] T099 [P] [US2] Remove packages/features/ee/workflows/lib/test/ directory (8 test files)
- [ ] T100 [P] [US2] Find and remove all workflow __tests__ directories using find command

### Remove Workflow Integrations in Booking Code

- [ ] T101 [US2] Search and remove workflow trigger calls in packages/features/bookings/lib/handleNewBooking/
- [ ] T102 [US2] Search and remove workflow references in packages/features/bookings/lib/service/RegularBookingService.ts
- [ ] T103 [US2] Remove packages/features/tasker/tasks/triggerFormSubmittedNoEvent/triggerFormSubmittedNoEventWorkflow.ts
- [ ] T104 [P] [US2] Remove packages/features/tasker/tasks/triggerNoShow/triggerGuestNoShow.ts
- [ ] T105 [P] [US2] Remove packages/features/tasker/tasks/triggerNoShow/triggerHostNoShow.ts
- [ ] T106 [US2] Search and remove workflow webhook triggers in apps/web/lib/daily-webhook/triggerWebhooks.ts

### Remove Workflows Dependencies

- [ ] T107 [US2] Remove "@trigger.dev/sdk": "4.1.2" from packages/features/package.json
- [ ] T108 [US2] Remove "trigger.dev": "4.0.0" from packages/features/package.json
- [ ] T109 [US2] Remove "dev:trigger" script from package.json
- [ ] T110 [US2] Remove "deploy:trigger" script from package.json
- [ ] T111 [US2] Run yarn install to update lockfile

### Validate Workflows Removal

- [ ] T112 [US2] Search codebase for remaining "workflow" references (grep -r "workflow" --exclude-dir=node_modules --exclude-dir=.next | grep -v "turbo.json")
- [ ] T113 [US2] Search codebase for remaining "trigger.dev" references
- [ ] T114 [US2] Run TypeScript compilation and capture errors (tsc --noEmit > specs/002-remove-features/tsc-errors-us2.txt)
- [ ] T115 [US2] Fix TypeScript errors related to workflow imports/types
- [ ] T116 [US2] Run build to verify no workflow routes remain (yarn build)
- [ ] T117 [US2] Test core scheduling functionality still works

**Checkpoint**: Workflows feature completely removed, routing removal intact, application builds

---

## Phase 5: User Story 3 - Remove Insight Features (Priority: P3)

**Goal**: Remove all insights/analytics code, reducing codebase by ~120 files and 8% LOC

**Independent Test**: Application builds, no insights UI accessible, all previous removals intact

### Remove Insights Database Code

- [ ] T118 [P] [US3] Remove packages/prisma/zod/modelSchema/BookingReportSchema.ts
- [ ] T119 [P] [US3] Remove packages/prisma/zod/modelSchema/BookingAuditSchema.ts
- [ ] T120 [P] [US3] Remove packages/prisma/zod/modelSchema/WatchlistEventAuditSchema.ts
- [ ] T121 [P] [US3] Remove packages/prisma/zod/modelSchema/FilterSegmentSchema.ts

### Remove Insights tRPC Routers

- [ ] T122 [US3] Remove packages/trpc/server/routers/viewer/insights/ directory (40+ procedures)
- [ ] T123 [US3] Remove insights router imports from packages/trpc/server/routers/viewer/_router.tsx

### Remove Insights Feature Modules

- [ ] T124 [US3] Remove packages/features/insights/ directory (120+ files: components, services, hooks, filters)
- [ ] T125 [US3] Evaluate packages/features/data-table/ directory - check if used only by insights or by other features
- [ ] T126 [US3] If data-table only used by insights: Remove packages/features/data-table/ directory
- [ ] T127 [US3] If data-table used elsewhere: Keep packages/features/data-table/ directory

### Remove Insights UI Pages

- [ ] T128 [P] [US3] Remove apps/web/app/(use-page-wrapper)/insights/ directory (main dashboard)
- [ ] T129 [P] [US3] Remove apps/web/app/(use-page-wrapper)/insights/router-position/ directory
- [ ] T130 [P] [US3] Remove apps/web/app/(use-page-wrapper)/insights/call-history/ directory
- [ ] T131 [P] [US3] Remove apps/web/modules/insights/ directory (3 view modules)

### Remove Insights API Routes

- [ ] T132 [P] [US3] Remove apps/web/pages/api/trpc/insights/[trpc].ts

### Remove Analytics App Store Integrations

- [ ] T133 [P] [US3] Remove packages/app-store/ga4/ directory (Google Analytics 4)
- [ ] T134 [P] [US3] Remove packages/app-store/gtm/ directory (Google Tag Manager)
- [ ] T135 [P] [US3] Remove packages/app-store/plausible/ directory
- [ ] T136 [P] [US3] Remove packages/app-store/posthog/ directory
- [ ] T137 [P] [US3] Remove packages/app-store/matomo/ directory
- [ ] T138 [P] [US3] Remove packages/app-store/umami/ directory
- [ ] T139 [P] [US3] Remove packages/app-store/fathom/ directory
- [ ] T140 [P] [US3] Remove packages/app-store/metapixel/ directory
- [ ] T141 [P] [US3] Remove packages/app-store/databuddy/ directory
- [ ] T142 [P] [US3] Remove packages/app-store/insights/ directory

### Remove Analytics Utilities

- [ ] T143 [P] [US3] Remove packages/app-store/_utils/getAnalytics.ts
- [ ] T144 [P] [US3] Check if apps/web/components/booking/BookingPageTagManager.tsx only handles analytics - remove if so

### Remove Insights Tests

- [ ] T145 [P] [US3] Remove apps/web/playwright/insights.e2e.ts
- [ ] T146 [P] [US3] Remove apps/web/playwright/insights-charts.e2e.ts
- [ ] T147 [P] [US3] Remove apps/web/playwright/apps/analytics/analyticsApps.e2e.ts
- [ ] T148 [P] [US3] Find and remove all insights __tests__ directories using find command

### Remove Insights Dependencies

- [ ] T149 [US3] Check if "recharts" is used outside of insights (grep -r "recharts" packages/ apps/ --exclude-dir=node_modules)
- [ ] T150 [US3] If recharts only used by insights: Remove "recharts" from package.json and run yarn install
- [ ] T151 [US3] If recharts used elsewhere: Keep "recharts" dependency

### Validate Insights Removal

- [ ] T152 [US3] Search codebase for remaining "insight" references (grep -r "insight" --exclude-dir=node_modules --exclude-dir=.next)
- [ ] T153 [US3] Search codebase for remaining "analytics" references related to removed integrations
- [ ] T154 [US3] Run TypeScript compilation and capture errors (tsc --noEmit > specs/002-remove-features/tsc-errors-us3.txt)
- [ ] T155 [US3] Fix TypeScript errors related to insights imports/types
- [ ] T156 [US3] Run build to verify no insights routes remain (yarn build)
- [ ] T157 [US3] Test core scheduling functionality still works

**Checkpoint**: All three features removed, application builds successfully

---

## Phase 6: Database Migration Execution & Cleanup

**Purpose**: Execute migration and verify database cleanup

- [ ] T158 Apply database migration (yarn prisma migrate deploy)
- [ ] T159 Verify all 27 tables dropped successfully (psql check)
- [ ] T160 Verify enums renamed to _old versions
- [ ] T161 Run prisma db pull to verify schema matches database
- [ ] T162 Generate final Prisma client (yarn prisma generate)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation across all removals

### Configuration Cleanup

- [ ] T163 [P] Search for workflow-related environment variables in .env.example and remove (TRIGGER_*, SENDGRID_*, TWILIO_*, CAL_AI_*)
- [ ] T164 [P] Search for analytics-related environment variables in .env.example and remove (GA4_*, GTM_*, PLAUSIBLE_*, etc.)
- [ ] T165 [P] Search for routing-related environment variables in .env.appStore.example and remove
- [ ] T166 [P] Update turbo.json if any feature-specific build tasks exist
- [ ] T167 [P] Update tsconfig.json to remove any feature-specific path references

### Navigation & UI Cleanup

- [ ] T168 Search for navigation menu references to workflows, routing, insights and remove
- [ ] T169 Search for sidebar links to removed features and remove
- [ ] T170 Check admin dashboard for removed feature tiles/cards and remove

### Documentation Cleanup

- [ ] T171 [P] Update README.md to remove references to workflows, routing, insights features
- [ ] T172 [P] Search docs/ directory for feature references and update/remove
- [ ] T173 [P] Update CHANGELOG.md or similar with feature removal note

### Final Validation

- [ ] T174 Run full TypeScript compilation (tsc --noEmit) and verify zero errors
- [ ] T175 Run full test suite (yarn test) and verify all remaining tests pass
- [ ] T176 Run E2E test suite (yarn e2e) for core scheduling paths
- [ ] T177 Measure final dependency count and verify 10%+ reduction (create specs/002-remove-features/metrics-after.json)
- [ ] T178 Measure build time and verify 5%+ improvement
- [ ] T179 Calculate final LOC reduction using cloc tool
- [ ] T180 Clear build cache (rm -rf .next node_modules/.cache apps/web/.next)
- [ ] T181 Full clean build from scratch (yarn clean && yarn install && yarn build)
- [ ] T182 Manual smoke test: Create booking, check availability, view calendar
- [ ] T183 Verify no 404 errors or console warnings on core pages
- [ ] T184 Create summary report in specs/002-remove-features/removal-report.md

**Checkpoint**: All features removed, all validations pass, production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (migration must be created first)
- **User Story 1 (Phase 3)**: Depends on Foundational - Remove Routing feature
- **User Story 2 (Phase 4)**: Depends on Foundational - Can run in parallel with US1, but may be safer sequentially
- **User Story 3 (Phase 5)**: Depends on Foundational - Can run in parallel with US1/US2, but safer sequentially
- **Migration Execution (Phase 6)**: Depends on all User Stories complete (code must be removed before DB migration)
- **Polish (Phase 7)**: Depends on Migration Execution complete

### User Story Dependencies

- **User Story 1 (Routing)**: Independent after Foundational - Safe to implement first
- **User Story 2 (Workflows)**: Independent after Foundational - Has junction table with routing (WorkflowsOnRoutingForms) so may be easier after routing removal
- **User Story 3 (Insights)**: Independent after Foundational - Has components for routing analytics, easier after routing removal

**Recommended Sequence**: Setup → Foundational → US1 (Routing) → US2 (Workflows) → US3 (Insights) → Migration → Polish

### Within Each User Story

**Routing (US1)**:
1. Database code removal (Prisma Zod schemas) - can parallelize
2. tRPC routers removal - sequential (router registration)
3. Feature modules removal - can parallelize by directory
4. UI components removal - can parallelize by directory
5. API routes removal - can parallelize
6. Tests removal - can parallelize
7. Dependencies removal - sequential (package.json)
8. Validation - sequential

**Workflows (US2)**: Similar pattern to US1
**Insights (US3)**: Similar pattern to US1

### Parallel Opportunities

- **Setup Phase**: T003, T004, T005 can run together (different scripts)
- **Within Routing Removal**: Most directory deletions can parallelize (T028-T057)
- **Within Workflows Removal**: Most directory deletions can parallelize (T069-T100)
- **Within Insights Removal**: Most directory deletions and app-store removals can parallelize (T118-T148)
- **Polish Phase**: Most documentation and config updates can parallelize (T163-T173)

---

## Parallel Example: Routing Feature Removal

```bash
# Launch all Prisma Zod schema removals together:
Task T028: Remove App_RoutingForms_FormSchema.ts
Task T029: Remove App_RoutingForms_FormResponseSchema.ts
Task T030: Remove App_RoutingForms_QueuedFormResponseSchema.ts
...

# Launch all UI directory removals together:
Task T044: Remove apps/web/app/(use-page-wrapper)/apps/routing-forms/
Task T045: Remove apps/web/components/apps/routing-forms/
Task T046: Remove apps/web/app/routing-forms/
...
```

---

## Implementation Strategy

### MVP First (Routing Only)

1. Complete Phase 1: Setup (7 tasks)
2. Complete Phase 2: Foundational - Create migration (20 tasks)
3. Complete Phase 3: User Story 1 - Remove Routing (41 tasks)
4. Execute Migration for routing tables only (modify migration to just Phase 2)
5. **STOP and VALIDATE**: Verify routing removal complete, app builds, core scheduling works
6. Optionally deploy as MVP (minimal app without routing)

### Incremental Delivery

1. Complete Setup + Foundational → Migration ready
2. Remove Routing (US1) → Validate independently → **Deploy Milestone 1**
3. Remove Workflows (US2) → Validate independently → **Deploy Milestone 2**
4. Remove Insights (US3) → Validate independently → **Deploy Milestone 3**
5. Execute migration → Final validation → **Deploy Complete**
6. Each milestone reduces complexity without breaking previous work

### Parallel Team Strategy (Not Recommended for Deletion Work)

**Warning**: Parallel removal of interconnected features is risky due to shared components (WorkflowsOnRoutingForms, routing insights, etc.). Sequential removal is safer.

If you must parallelize:
1. Ensure Foundational phase complete (migration created)
2. Assign one feature per developer
3. Coordinate on shared components (WorkflowsOnRoutingForms junction table)
4. Merge in order: Routing → Workflows → Insights

---

## Notes

- **CRITICAL**: Do NOT execute database migration until ALL code removal is complete
- **CAUTION**: WorkflowsOnRoutingForms junction table links workflows and routing - handle carefully
- **SAFETY**: Run full test suite after each user story completion
- **VERIFICATION**: TypeScript compilation is your friend - use it frequently
- **BACKUP**: Keep current schema and test results for comparison
- [P] tasks = different files/directories, can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each logical group of tasks (e.g., after removing all routing tRPC routers)
- Use grep extensively to verify complete removal of features
- Some tasks require conditional checks (e.g., recharts usage, data-table usage)

---

## Task Count Summary

- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational - Migration)**: 20 tasks
- **Phase 3 (US1 - Routing)**: 41 tasks
- **Phase 4 (US2 - Workflows)**: 49 tasks
- **Phase 5 (US3 - Insights)**: 40 tasks
- **Phase 6 (Migration Execution)**: 5 tasks
- **Phase 7 (Polish)**: 22 tasks
- **Total**: 184 tasks

**Parallelizable Tasks**: ~120 tasks (65% can run in parallel within phases)
**Sequential Tasks**: ~64 tasks (35% must run in order)

**Estimated Effort**:
- With parallelization: ~3-4 days (large-scale deletion project)
- Sequential execution: ~5-7 days

**Risk Level**: Medium-High (400+ files, 27 database tables, no rollback)
**Recommendation**: Execute in MVP increments (one user story at a time)
