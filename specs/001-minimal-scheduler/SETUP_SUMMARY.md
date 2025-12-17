# Setup Summary: Minimal Scheduling Application

**Date**: 2025-12-16
**Purpose**: Document current codebase state and implementation plan

## Current Codebase Analysis

### Prisma Schema Status

**Existing Models Found**:
- ✅ `Booking` model exists (line 823) with:
  - Status enum: CANCELLED, ACCEPTED, REJECTED, PENDING, AWAITING_HOST
  - Fields: id, uid, userId, startTime, endTime, title, description, status, etc.
  - **Needs**: Add CONFIRMED status, add videoProvider/videoLink fields, ensure timezone field

- ⚠️ `Availability` model exists (line 931) but:
  - Tied to Schedule and EventType (complex relationship)
  - Uses days array, startTime/endTime as DateTime
  - **Needs**: Create simpler AvailabilityBlock model per data-model.md

- ❌ `CalendarIntegration` model: **NOT FOUND** - needs creation
- ❌ `CalendarEvent` model: **NOT FOUND** - needs creation

**Non-Core Models to Remove** (per constitution):
- Team, Workflow, Payment, EventType, Webhook, WorkflowStep, WorkflowReminder, etc.

### tRPC Router Structure

**Existing Routers**:
- `packages/trpc/server/routers/viewer/bookings/` - exists, needs simplification
- `packages/trpc/server/routers/viewer/availability/` - exists, needs simplification
- `packages/trpc/server/routers/viewer/calendars/` - exists, needs review
- `packages/trpc/server/routers/publicViewer/` - exists, needs public booking endpoints

**Needs**:
- Create `packages/trpc/server/routers/public/booking.ts` for public endpoints
- Simplify existing routers to remove non-core features

### UI Components Structure

**Existing Components**:
- `packages/ui/components/` - extensive component library
- `packages/ui/components/form/` - form components exist
- `packages/ui/components/booking/` - some booking components may exist

**Needs**:
- Create availability display components
- Create booking form components
- Create booking confirmation components
- Simplify existing components

### Next.js App Router Structure

**Existing Pages**:
- `apps/web/app/(use-page-wrapper)/(main-nav)/bookings/` - exists
- `apps/web/app/(use-page-wrapper)/(main-nav)/availability/` - exists
- `apps/web/app/(use-page-wrapper)/settings/` - exists

**Needs**:
- Create `apps/web/app/(use-page-wrapper)/[username]/page.tsx` for public scheduling
- Simplify existing admin pages

## Implementation Strategy

Given the complexity of the existing Cal.com codebase, we'll:

1. **Phase 1**: Document current state (complete)
2. **Phase 2**: Create new simplified models alongside existing ones (migration approach)
3. **Phase 3+**: Implement features using new models, gradually deprecating old ones

This approach minimizes risk and allows gradual migration rather than breaking changes.

## Key Findings

1. Booking model exists but needs status updates (CONFIRMED) and video fields
2. Availability model exists but is complex - we'll create AvailabilityBlock as new model
3. Calendar integration models don't exist - need full creation
4. Many non-core features exist that need removal (but can be done gradually)
5. Existing tRPC routers can be extended rather than replaced

## Next Steps

Proceed to Phase 2: Foundational tasks to create new models and infrastructure.

