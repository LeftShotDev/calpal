# Feature Specification: Remove Routing, Workflows, and Insight Features

**Feature Branch**: `002-remove-features`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "update to remove Routing, Workflows, Insight features"

## Clarifications

### Session 2025-12-17

- Q: How should the system handle existing user data that references the removed features (e.g., user routing configurations, workflow definitions, insight preferences)? → A: Delete all data related to removed features immediately during migration
- Q: What is the rollback strategy if feature removal causes critical production issues? → A: No rollback capability - commit fully to removal and fix forward only
- Q: How should the team systematically identify all code, files, and references related to these three features across the entire codebase? → A: Automated scanning tools (AST analysis, grep patterns, dependency graphs) with manual verification
- Q: How comprehensive should regression testing be after removing these features? → A: Targeted - comprehensive testing of core scheduling paths, basic smoke tests elsewhere
- Q: What is the deployment strategy for database migrations that delete feature tables and data? → A: Single migration that drops all tables and data in one atomic transaction

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Routing Feature (Priority: P1)

As a developer maintaining the minimal scheduling application, I need to remove all routing-related features from the codebase so that the application remains focused on core scheduling functionality and reduces maintenance complexity.

**Why this priority**: Routing is typically a complex feature that adds significant code overhead and maintenance burden. Removing it first provides the most immediate reduction in codebase complexity and aligns with the constitution's Feature Stripping Mandate.

**Independent Test**: Can be fully tested by verifying that all routing-related code, UI components, database tables, and API endpoints are removed, and that the application still functions correctly for basic scheduling operations.

**Acceptance Scenarios**:

1. **Given** routing feature exists in the codebase, **When** the removal is complete, **Then** all routing-related database tables, models, and migrations are removed
2. **Given** routing UI components exist, **When** the removal is complete, **Then** all routing-related pages, components, and navigation items are removed
3. **Given** routing API endpoints exist, **When** the removal is complete, **Then** all routing-related tRPC routers and API handlers are removed
4. **Given** routing dependencies exist, **When** the removal is complete, **Then** all unused npm packages related to routing are removed from package.json
5. **Given** the application runs successfully, **When** routing is removed, **Then** core scheduling functionality (creating bookings, managing availability) continues to work without errors

---

### User Story 2 - Remove Workflows Feature (Priority: P2)

As a developer maintaining the minimal scheduling application, I need to remove all workflow automation features from the codebase so that the application remains lightweight and focused on simple scheduling without complex automation logic.

**Why this priority**: Workflows typically involve complex automation logic, potentially trigger.dev integrations, and significant backend code. This is the second-highest priority because it likely represents substantial code volume and complexity.

**Independent Test**: Can be fully tested by verifying that all workflow-related code, automation triggers, and integrations are removed, and that basic scheduling operations remain functional.

**Acceptance Scenarios**:

1. **Given** workflow feature exists in the codebase, **When** the removal is complete, **Then** all workflow-related database tables, models, and migrations are removed
2. **Given** workflow UI exists, **When** the removal is complete, **Then** all workflow configuration pages and components are removed
3. **Given** workflow automation logic exists, **When** the removal is complete, **Then** all workflow triggers, actions, and execution logic are removed
4. **Given** trigger.dev integration exists, **When** the removal is complete, **Then** all trigger.dev-related code and configurations are removed
5. **Given** workflow dependencies exist, **When** the removal is complete, **Then** all unused npm packages related to workflows are removed from package.json

---

### User Story 3 - Remove Insight Features (Priority: P3)

As a developer maintaining the minimal scheduling application, I need to remove all insight/analytics features from the codebase so that the application remains simple and focused on core scheduling without advanced analytics.

**Why this priority**: Insights/analytics features are typically isolated and have fewer dependencies on core scheduling functionality. This is lower priority because removal is likely more straightforward and has less risk to core operations.

**Independent Test**: Can be fully tested by verifying that all insight-related code, analytics dashboards, and reporting components are removed, and that core scheduling functionality remains intact.

**Acceptance Scenarios**:

1. **Given** insight feature exists in the codebase, **When** the removal is complete, **Then** all insight-related database tables, models, and migrations are removed
2. **Given** insight UI exists, **When** the removal is complete, **Then** all analytics dashboards, charts, and reporting pages are removed
3. **Given** insight API endpoints exist, **When** the removal is complete, **Then** all insight-related tRPC routers and data aggregation logic are removed
4. **Given** insight dependencies exist, **When** the removal is complete, **Then** all unused npm packages related to analytics/charting are removed from package.json
5. **Given** insight tracking code exists, **When** the removal is complete, **Then** all event tracking and analytics collection code is removed

---

### Edge Cases

- What happens if environment variables or configuration settings reference removed features?
- How are TypeScript types and interfaces that reference removed features handled?
- What happens to existing tests that cover the removed features?
- What happens if the atomic migration transaction fails mid-execution?
- How are foreign key constraints from retained tables that reference removed tables handled?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Feature identification MUST use automated scanning tools (AST analysis, grep patterns, dependency graphs) with manual verification to locate all related code
- **FR-002**: System MUST remove all routing-related database tables, models, and Prisma schema definitions
- **FR-003**: System MUST remove all workflow-related database tables, models, and Prisma schema definitions
- **FR-004**: System MUST remove all insight-related database tables, models, and Prisma schema definitions
- **FR-005**: Database migrations MUST delete all existing user data related to routing, workflows, and insights (no archiving or soft deletes)
- **FR-005a**: Database migrations MUST execute as a single atomic transaction that drops all feature tables and data together
- **FR-006**: System MUST remove all routing-related UI components, pages, and navigation items from apps/web
- **FR-007**: System MUST remove all workflow-related UI components, pages, and configuration interfaces from apps/web
- **FR-008**: System MUST remove all insight-related UI components, dashboards, and reporting pages from apps/web
- **FR-009**: System MUST remove all routing-related tRPC routers and API handlers from packages/trpc
- **FR-010**: System MUST remove all workflow-related tRPC routers and automation logic from packages/trpc
- **FR-011**: System MUST remove all insight-related tRPC routers and data aggregation logic from packages/trpc
- **FR-012**: System MUST remove all unused npm dependencies related to routing, workflows, and insights from package.json files
- **FR-013**: System MUST remove all test files specific to routing, workflows, and insights features
- **FR-014**: System MUST update any navigation menus, sidebars, or UI elements that reference removed features
- **FR-015**: System MUST remove or update environment variable references to removed features
- **FR-016**: System MUST remove feature flags or configuration settings related to removed features
- **FR-017**: System MUST ensure no broken TypeScript imports or references remain after removals
- **FR-018**: Core scheduling functionality MUST remain fully operational after all removals
- **FR-019**: System MUST pass all remaining tests after feature removal
- **FR-020**: Regression testing MUST comprehensively cover core scheduling paths (booking creation, availability management, calendar integration) with basic smoke tests for other features
- **FR-021**: System MUST successfully build without errors after all removals
- **FR-022**: Removal process MUST be irreversible with no rollback mechanism (all code and data permanently deleted)

### Key Entities *(include if feature involves data)*

- **Routing Tables**: Database tables storing routing rules, conditions, and configurations that must be removed
- **Workflow Tables**: Database tables storing workflow definitions, triggers, actions, and execution history that must be removed
- **Insight Tables**: Database tables storing analytics data, aggregations, and report configurations that must be removed
- **Dependencies**: npm packages specifically used for routing, workflow automation, and analytics that can be safely removed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All routing-related code is removed from the codebase, reducing total lines of code by at least 10%
- **SC-002**: All workflow-related code is removed from the codebase, reducing total lines of code by at least 15%
- **SC-003**: All insight-related code is removed from the codebase, reducing total lines of code by at least 8%
- **SC-004**: The application successfully builds and passes all remaining tests after feature removal
- **SC-005**: Comprehensive regression test suite for core scheduling paths (booking, availability, calendar integration) passes with 100% success rate
- **SC-006**: Core scheduling functionality (user scheduling, admin calendar integration, availability management) operates without errors
- **SC-007**: npm package count is reduced by at least 10% through removal of unused dependencies
- **SC-008**: The codebase has zero TypeScript errors after all removals
- **SC-009**: The application startup time improves by at least 5% due to reduced code complexity
- **SC-010**: Database schema is cleaned up with all unnecessary tables removed and migrations properly documented
- **SC-011**: No references to removed features remain in UI, documentation, or configuration files
