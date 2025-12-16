# Research: Minimal Scheduling Application

**Date**: 2025-12-16
**Feature**: Minimal Scheduling Application
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Areas

### 1. Google Calendar API Integration

**Decision**: Use Google Calendar API v3 with OAuth2 authentication, leveraging existing Cal.com integration patterns but simplified.

**Rationale**:
- Cal.com already has Google Calendar integration that can be simplified
- OAuth2 is standard for Google APIs and provides secure token management
- API v3 is stable and well-documented
- Can reuse existing OAuth flow patterns from Cal.com codebase

**Alternatives Considered**:
- Google Calendar API v3 (chosen) - stable, well-supported
- Google Calendar API v1 (deprecated) - not viable
- Third-party calendar sync services - adds unnecessary dependency and cost

**Key Findings**:
- Use `calendar.events.list` to fetch busy times
- Use `calendar.events.insert` to create booking events
- Implement incremental sync using `syncToken` to avoid query loops
- Store OAuth tokens securely, refresh automatically before expiry
- Handle timezone conversion at API level using `timeZone` parameter

**Implementation Notes**:
- Reuse existing `packages/app-store/google-calendar` integration
- Simplify to only support primary calendar (remove multiple calendar support)
- Implement efficient sync using `syncToken` pattern to avoid full calendar scans

---

### 2. Google Meet Integration

**Decision**: Generate Google Meet links using Google Calendar API's `conferenceData` feature when creating events.

**Rationale**:
- Google Meet links can be generated automatically when creating calendar events
- No separate API calls needed - integrated with calendar event creation
- Links are automatically added to calendar events
- Users can join via the calendar event link

**Alternatives Considered**:
- Google Meet API (separate) - unnecessary complexity, calendar integration sufficient
- Manual link generation - less reliable, requires separate management
- Third-party meeting link services - violates "essential integrations only" principle

**Key Findings**:
- Use `conferenceData` in calendar event creation
- Set `conferenceData.createRequest.requestId` with unique ID
- Set `conferenceData.createRequest.conferenceSolutionKey.type` to "hangoutsMeet"
- Meeting link automatically included in event response

**Implementation Notes**:
- Integrate with calendar event creation flow
- Store meeting link in booking record for email confirmations
- No separate Google Meet API credentials needed (uses same OAuth token)

---

### 3. Zoom Integration

**Decision**: Use Zoom API v2 to create meetings programmatically, store credentials securely.

**Rationale**:
- Zoom provides OAuth2 and Server-to-Server OAuth options
- Can create meetings on-demand when bookings are made
- Meeting links can be added to calendar events
- Supports both OAuth (user-initiated) and Server-to-Server (admin-initiated) flows

**Alternatives Considered**:
- Zoom OAuth (user-initiated) - requires user to authenticate, adds friction
- Zoom Server-to-Server OAuth (chosen) - admin authenticates once, system creates meetings automatically
- Manual Zoom link entry - violates automation requirement

**Key Findings**:
- Use Server-to-Server OAuth for admin-authenticated meeting creation
- Create meetings via `POST /users/{userId}/meetings` endpoint
- Store Zoom credentials securely (encrypted, similar to Google Calendar tokens)
- Include `join_url` from meeting response in calendar events and confirmations
- Handle meeting deletion/cancellation when bookings are cancelled

**Implementation Notes**:
- Add Zoom app to `packages/app-store/zoom` (simplify existing if present)
- Store Server-to-Server OAuth tokens securely
- Create meetings synchronously during booking creation (acceptable latency for user experience)
- Handle API failures gracefully (booking can complete without video link if Zoom API fails)

---

### 4. Timezone Handling

**Decision**: Use `date-fns-tz` library (already in Cal.com dependencies) for all timezone conversions, store all times in UTC in database.

**Rationale**:
- `date-fns-tz` is already a dependency in Cal.com
- Provides reliable timezone conversion without heavy dependencies
- UTC storage ensures consistency and avoids DST issues
- Client-side timezone detection using browser APIs

**Alternatives Considered**:
- Day.js with timezone plugin - already in codebase but performance concerns noted in Cal.com docs
- Native JavaScript Intl API - less feature-rich, more verbose
- Moment.js - deprecated, heavy bundle size
- `date-fns-tz` (chosen) - lightweight, already in dependencies, good performance

**Key Findings**:
- Store all datetime values in UTC in database
- Convert to user's timezone for display using `date-fns-tz`
- Detect user timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Allow manual timezone selection as fallback
- Handle DST transitions automatically via library
- Availability blocks stored with admin's timezone, converted when displaying to users

**Implementation Notes**:
- Use `formatInTimeZone` from `date-fns-tz` for display
- Use `toZonedTime` / `fromZonedTime` for conversions
- Store timezone strings (e.g., "America/New_York") in availability blocks
- Convert availability blocks to user timezone when calculating available slots

---

### 5. Backend Sync Optimization

**Decision**: Implement incremental sync using Google Calendar API `syncToken`, batch availability calculations, use database indexes, avoid N+1 queries.

**Rationale**:
- `syncToken` pattern prevents full calendar scans on each sync
- Batch processing reduces API calls and database queries
- Proper indexing ensures fast availability calculations
- Eliminates query loops mentioned in requirements

**Alternatives Considered**:
- Full calendar sync on each request - too slow, violates performance requirements
- Polling-based sync - inefficient, creates unnecessary load
- Incremental sync with syncToken (chosen) - efficient, standard pattern
- Webhook-based sync - requires webhook infrastructure, adds complexity

**Key Findings**:
- Use `syncToken` from previous sync response for next sync request
- Store `syncToken` in calendar integration record
- On first sync, do full sync, store `syncToken` for subsequent incremental syncs
- Batch availability calculations: fetch all relevant data, calculate in memory
- Use Prisma `select` instead of `include` to fetch only needed fields
- Add database indexes on: `booking.startTime`, `availabilityBlock.dayOfWeek`, `calendarIntegration.userId`

**Implementation Notes**:
- Implement sync service that runs periodically (e.g., every 5 minutes) or on-demand
- Cache availability calculations with short TTL (30 seconds) to reduce database load
- Use database transactions for booking creation to prevent race conditions
- Implement optimistic locking for double-booking prevention

---

### 6. Bundle Size Reduction Strategies

**Decision**: Remove unused dependencies, code-split routes, lazy-load components, remove unused Cal.com features, tree-shake effectively.

**Rationale**:
- Constitution requires 40%+ bundle size reduction
- Next.js provides built-in code splitting
- Removing unused features directly reduces bundle size
- Tree-shaking removes dead code automatically

**Alternatives Considered**:
- Complete rewrite - too risky, loses existing functionality
- Gradual removal (chosen) - safer, measurable progress
- Micro-frontend architecture - adds complexity, violates simplicity principle
- Separate bundles per feature - Next.js already handles this via code splitting

**Key Findings**:
- Remove unused app-store integrations (keep only Google Calendar, Google Meet, Zoom)
- Remove workflow packages (`packages/features/ee/workflows`)
- Remove payment processing packages
- Remove team/organization features
- Use dynamic imports for heavy components (calendar views, video setup)
- Analyze bundle with `@next/bundle-analyzer`
- Remove unused UI components from `packages/ui`

**Implementation Notes**:
- Audit dependencies: `yarn why <package>` to find unused packages
- Use Next.js dynamic imports: `dynamic(() => import('./Component'))`
- Remove entire feature packages that aren't needed
- Keep core UI components but remove specialized ones (e.g., payment forms, team management UI)

---

### 7. Performance Optimization

**Decision**: Implement server-side rendering for public pages, optimize database queries, use React Server Components where appropriate, implement proper caching.

**Rationale**:
- Constitution requires 50%+ performance improvement
- Next.js App Router provides RSC support
- Server-side rendering improves initial page load
- Proper caching reduces database and API load

**Alternatives Considered**:
- Client-side only rendering - slower initial load, worse SEO
- Full SSR (chosen) - better performance, SEO, user experience
- Static site generation - not suitable for dynamic availability data
- Edge functions - may be overkill for this use case initially

**Key Findings**:
- Use Next.js App Router with Server Components for public scheduling pages
- Implement ISR (Incremental Static Regeneration) for availability data with short revalidation
- Use `unstable_cache` for availability calculations
- Optimize Prisma queries: use `select`, add indexes, avoid N+1
- Implement response caching headers for API routes
- Use React Server Components to reduce client-side JavaScript

**Implementation Notes**:
- Convert scheduling pages to Server Components where possible
- Cache availability calculations for 30 seconds
- Use database connection pooling
- Implement query result caching for frequently accessed data
- Monitor performance with Next.js analytics

---

## Summary of Technical Decisions

| Area | Decision | Key Technology |
|------|----------|----------------|
| Calendar Integration | Google Calendar API v3 with OAuth2, incremental sync | `syncToken` pattern |
| Google Meet | Calendar API `conferenceData` | No separate API needed |
| Zoom | Zoom API v2 Server-to-Server OAuth | Programmatic meeting creation |
| Timezone Handling | `date-fns-tz` with UTC storage | Browser timezone detection |
| Backend Sync | Incremental sync, batch processing, proper indexing | `syncToken`, Prisma `select` |
| Bundle Size | Remove unused features, code splitting, tree-shaking | Next.js dynamic imports |
| Performance | SSR, RSC, caching, query optimization | Next.js App Router, Prisma optimization |

## Remaining Technical Context

All technical unknowns have been resolved. The implementation can proceed with:
- Existing Cal.com tech stack (Next.js, tRPC, Prisma, React)
- Simplified integrations (Google Calendar, Google Meet, Zoom only)
- Performance optimizations (incremental sync, caching, code splitting)
- Bundle size reduction (feature removal, dynamic imports)

