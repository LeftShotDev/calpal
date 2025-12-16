# Tasks: Minimal Scheduling Application

**Input**: Design documents from `/specs/001-minimal-scheduler/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL and not explicitly requested in the specification. Focus on implementation tasks only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `apps/web/`, `packages/prisma/`, `packages/trpc/`, `packages/ui/`, `packages/features/`, `packages/lib/`
- Paths follow Cal.com monorepo structure with Yarn workspaces

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Verify existing Cal.com monorepo structure and dependencies
- [x] T002 [P] Review and document current Prisma schema in packages/prisma/schema.prisma
- [x] T003 [P] Review existing tRPC router structure in packages/trpc/server/routers/
- [x] T004 [P] Review existing UI component structure in packages/ui/components/
- [x] T005 [P] Review existing Next.js App Router structure in apps/web/app/
- [x] T006 Identify and document non-core features to be removed (workflows, payments, teams, etc.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Simplify Prisma schema: Remove non-core entities (Team, Workflow, Payment, EventType, Webhook, etc.) from packages/prisma/schema.prisma
- [ ] T008 Update Booking model in packages/prisma/schema.prisma: Add status enum (pending/confirmed/rejected/cancelled), ensure all required fields from data-model.md
- [ ] T009 Create AvailabilityBlock model in packages/prisma/schema.prisma with fields: id, userId, dayOfWeek, startTime, endTime, timezone, isActive, timestamps
- [ ] T010 Create CalendarIntegration model in packages/prisma/schema.prisma with fields: id, userId, type, encrypted tokens, syncToken, syncStatus, timestamps
- [ ] T011 Create CalendarEvent model in packages/prisma/schema.prisma with fields: id, calendarIntegrationId, externalEventId, startTime, endTime, title, isBusy, timestamps
- [ ] T012 Add database indexes per data-model.md: Booking (userId+startTime, startTime+endTime, status), AvailabilityBlock (userId+dayOfWeek, userId+isActive), CalendarIntegration (userId+type, syncStatus)
- [ ] T013 Create database migration for simplified schema in packages/prisma/migrations/
- [ ] T014 [P] Setup timezone utilities in packages/lib/timezone/ using date-fns-tz per research.md
- [ ] T015 [P] Setup calendar API client utilities in packages/lib/calendar/ for Google Calendar API v3
- [ ] T016 [P] Configure rate limiting middleware for public endpoints (10 bookings per IP per hour) in packages/trpc/server/middleware/
- [ ] T017 Setup email service integration using existing Cal.com infrastructure (SMTP/Resend/SendGrid) in packages/lib/email/

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Schedule a Meeting (Priority: P1) 🎯 MVP

**Goal**: Users can visit a scheduling page, view available time slots, submit booking requests, and receive pending confirmation. Admins can approve/reject bookings.

**Independent Test**: Can be fully tested by having a user visit a scheduling page, view available time slots, select a time, provide contact information, submit booking, receive pending confirmation, then admin approves and user receives final confirmation. This delivers immediate value: a meeting is scheduled and appears in the admin's calendar.

### Implementation for User Story 1

- [ ] T018 [P] [US1] Create BookingService in packages/features/bookings/services/BookingService.ts with methods: createPendingBooking, approveBooking, rejectBooking, getBookingsByUser
- [ ] T019 [P] [US1] Create AvailabilityService in packages/features/availability/services/AvailabilityService.ts with method: calculateAvailableSlots (combines availability blocks + calendar events + bookings)
- [ ] T020 [US1] Create public.booking.getAvailability tRPC procedure in packages/trpc/server/routers/public/booking.ts (depends on T019)
- [ ] T021 [US1] Create public.booking.createBooking tRPC procedure in packages/trpc/server/routers/public/booking.ts with rate limiting, validation, double-booking prevention (depends on T018, T019)
- [ ] T022 [US1] Create bookings.approve tRPC procedure in packages/trpc/server/routers/bookings.ts for admin approval (depends on T018)
- [ ] T023 [US1] Create bookings.reject tRPC procedure in packages/trpc/server/routers/bookings.ts for admin rejection (depends on T018)
- [ ] T024 [US1] Create bookings.list tRPC procedure in packages/trpc/server/routers/bookings.ts for admin to view bookings (depends on T018)
- [ ] T025 [US1] Implement email notification service: Send pending confirmation to user in packages/lib/email/notifications.ts (depends on T017)
- [ ] T026 [US1] Implement email notification service: Notify admin of pending booking in packages/lib/email/notifications.ts (depends on T017)
- [ ] T027 [US1] Implement email notification service: Send confirmation email when booking approved in packages/lib/email/notifications.ts (depends on T017)
- [ ] T028 [US1] Implement email notification service: Send rejection email when booking rejected in packages/lib/email/notifications.ts (depends on T017)
- [ ] T029 [US1] Create public scheduling page component in apps/web/app/(use-page-wrapper)/[username]/page.tsx
- [ ] T030 [US1] Create availability display component in packages/ui/components/availability/AvailabilityDisplay.tsx
- [ ] T031 [US1] Create booking form component in packages/ui/components/booking/BookingForm.tsx
- [ ] T032 [US1] Create booking confirmation component (pending state) in packages/ui/components/booking/BookingConfirmation.tsx
- [ ] T033 [US1] Create admin bookings list page in apps/web/app/(use-page-wrapper)/(main-nav)/bookings/page.tsx
- [ ] T034 [US1] Create admin booking approval/rejection UI component in packages/ui/components/bookings/BookingActions.tsx
- [ ] T035 [US1] Add timezone detection and conversion in public scheduling page (client-side) in apps/web/app/(use-page-wrapper)/[username]/page.tsx
- [ ] T036 [US1] Implement double-booking prevention logic in BookingService.createPendingBooking using database transactions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can submit bookings, admins can approve/reject, and confirmations are sent.

---

## Phase 4: User Story 2 - Admin Calendar Integration (Priority: P1)

**Goal**: Admins can connect their Google Calendar, system syncs events to determine availability, admins can view sync status and disconnect.

**Independent Test**: Can be fully tested by having an admin authenticate with Google Calendar, verify the connection status, confirm that calendar events are being read to determine availability, and disconnect/reconnect. This delivers immediate value: the system knows when the admin is busy.

### Implementation for User Story 2

- [ ] T037 [P] [US2] Create CalendarSyncService in packages/features/calendar/services/CalendarSyncService.ts with methods: performIncrementalSync, performFullSync, handleSyncToken
- [ ] T038 [P] [US2] Create GoogleCalendarClient in packages/lib/calendar/GoogleCalendarClient.ts for Google Calendar API v3 operations (list events, create events, sync token management)
- [ ] T039 [US2] Implement OAuth2 flow for Google Calendar: Generate auth URL in packages/features/calendar/services/CalendarAuthService.ts (depends on T038)
- [ ] T040 [US2] Implement OAuth2 callback handler: Exchange code for tokens, store encrypted in packages/features/calendar/services/CalendarAuthService.ts (depends on T038)
- [ ] T041 [US2] Create calendar.connect tRPC procedure in packages/trpc/server/routers/calendar.ts (depends on T039)
- [ ] T042 [US2] Create calendar.callback tRPC procedure in packages/trpc/server/routers/calendar.ts (depends on T040)
- [ ] T043 [US2] Create calendar.getIntegration tRPC procedure in packages/trpc/server/routers/calendar.ts
- [ ] T044 [US2] Create calendar.disconnect tRPC procedure in packages/trpc/server/routers/calendar.ts
- [ ] T045 [US2] Create calendar.sync tRPC procedure (manual trigger) in packages/trpc/server/routers/calendar.ts (depends on T037)
- [ ] T046 [US2] Implement background sync job: Periodic calendar sync every 5 minutes in packages/features/calendar/jobs/syncJob.ts (depends on T037)
- [ ] T047 [US2] Implement token refresh logic: Auto-refresh expired OAuth tokens in packages/features/calendar/services/CalendarAuthService.ts
- [ ] T048 [US2] Create calendar integration settings page in apps/web/app/(use-page-wrapper)/(main-nav)/settings/integrations/calendar/page.tsx
- [ ] T049 [US2] Create calendar connection UI component in packages/ui/components/calendar/CalendarConnection.tsx
- [ ] T050 [US2] Create calendar sync status display component in packages/ui/components/calendar/SyncStatus.tsx
- [ ] T051 [US2] Integrate calendar events into availability calculation: Update AvailabilityService.calculateAvailableSlots to exclude CalendarEvent times (depends on T019, T037)
- [ ] T052 [US2] Implement calendar event cleanup: Remove CalendarEvent records older than 90 days in packages/features/calendar/services/CalendarSyncService.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Calendar integration enables accurate availability display.

---

## Phase 5: User Story 3 - Admin Availability Block Management (Priority: P2)

**Goal**: Admins can create, edit, and delete availability blocks. System uses these blocks to determine available time slots.

**Independent Test**: Can be fully tested by having an admin create availability blocks (e.g., Monday-Friday 9am-5pm), verify they appear in settings, edit them, and confirm that only times within these blocks are shown as available to users. This delivers immediate value: admins control when they accept bookings.

### Implementation for User Story 3

- [ ] T053 [P] [US3] Create AvailabilityBlockService in packages/features/availability/services/AvailabilityBlockService.ts with methods: create, update, delete, listByUser
- [ ] T054 [US3] Create availability.list tRPC procedure in packages/trpc/server/routers/availability.ts (depends on T053)
- [ ] T055 [US3] Create availability.create tRPC procedure in packages/trpc/server/routers/availability.ts (depends on T053)
- [ ] T056 [US3] Create availability.update tRPC procedure in packages/trpc/server/routers/availability.ts (depends on T053)
- [ ] T057 [US3] Create availability.delete tRPC procedure in packages/trpc/server/routers/availability.ts (depends on T053)
- [ ] T058 [US3] Create availability settings page in apps/web/app/(use-page-wrapper)/(main-nav)/settings/availability/page.tsx
- [ ] T059 [US3] Create availability block list component in packages/ui/components/availability/AvailabilityBlockList.tsx
- [ ] T060 [US3] Create availability block form component (create/edit) in packages/ui/components/availability/AvailabilityBlockForm.tsx
- [ ] T061 [US3] Implement availability block validation: dayOfWeek (0-6), time range, timezone validation in AvailabilityBlockService
- [ ] T062 [US3] Update AvailabilityService.calculateAvailableSlots to use AvailabilityBlock data (union of overlapping blocks) (depends on T019, T053)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Admins can configure availability blocks.

---

## Phase 6: User Story 4 - Video Conferencing Integration (Priority: P2)

**Goal**: Users can select Google Meet or Zoom when scheduling. System generates video links and includes them in confirmations and calendar events.

**Independent Test**: Can be fully tested by having a user schedule a meeting with Google Meet selected, receiving a confirmation with a Google Meet link, and verifying the link works. Then repeating with Zoom. This delivers immediate value: users can join meetings remotely.

### Implementation for User Story 4

- [ ] T063 [P] [US4] Create VideoService in packages/features/video/services/VideoService.ts with methods: generateGoogleMeetLink, generateZoomLink
- [ ] T064 [P] [US4] Implement Google Meet link generation: Use Google Calendar API conferenceData when creating calendar events in packages/features/video/services/GoogleMeetService.ts
- [ ] T065 [P] [US4] Create Zoom API client for Server-to-Server OAuth in packages/lib/video/ZoomClient.ts
- [ ] T066 [US4] Implement Zoom link generation: Create Zoom meeting via API in packages/features/video/services/ZoomService.ts (depends on T065)
- [ ] T067 [US4] Create video.generateGoogleMeetLink tRPC procedure in packages/trpc/server/routers/video.ts (depends on T064)
- [ ] T068 [US4] Create video.generateZoomLink tRPC procedure in packages/trpc/server/routers/video.ts (depends on T066)
- [ ] T069 [US4] Integrate video link generation into booking approval flow: Generate link when booking approved in BookingService.approveBooking (depends on T018, T063)
- [ ] T070 [US4] Add video provider selection to booking form in packages/ui/components/booking/BookingForm.tsx
- [ ] T071 [US4] Display video link in booking confirmation email template in packages/lib/email/templates/bookingConfirmation.tsx
- [ ] T072 [US4] Include video link in Google Calendar event when creating calendar event in CalendarSyncService (depends on T037, T063)
- [ ] T073 [US4] Handle video API failures gracefully: Booking completes without video link if API fails in VideoService methods

**Checkpoint**: All user stories should now be independently functional. Video conferencing enhances the scheduling experience.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T074 [P] Implement data retention job: Auto-delete bookings older than 1 year in packages/features/bookings/jobs/dataRetentionJob.ts
- [ ] T075 [P] Add error handling and logging across all services (BookingService, AvailabilityService, CalendarSyncService, VideoService)
- [ ] T076 [P] Optimize database queries: Use Prisma select instead of include, add missing indexes per performance requirements
- [ ] T077 [P] Implement caching for availability calculations: Cache results for 30 seconds to reduce database load in AvailabilityService
- [ ] T078 [P] Remove non-core features: Strip workflows, payments, teams, advanced notifications from codebase per FR-021
- [ ] T079 [P] Optimize bundle size: Remove unused dependencies, implement code splitting, use dynamic imports for heavy components
- [ ] T080 [P] Performance optimization: Implement ISR for public scheduling pages, optimize React Server Components usage
- [ ] T081 [P] Update documentation: README.md, quickstart.md validation, API documentation
- [ ] T082 Code cleanup and refactoring: Remove redundant Cal.com patterns, simplify code structure
- [ ] T083 Run quickstart.md validation: Verify all setup steps work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 (availability calculation) but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (availability calculation) but independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 (booking approval) and US2 (calendar events) but independently testable

### Within Each User Story

- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (both P1)
- User Stories 3 and 4 can start in parallel after US1/US2 (both P2)
- Services within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all services for User Story 1 together:
Task: "Create BookingService in packages/features/bookings/services/BookingService.ts"
Task: "Create AvailabilityService in packages/features/availability/services/AvailabilityService.ts"

# Launch all UI components together:
Task: "Create availability display component in packages/ui/components/availability/AvailabilityDisplay.tsx"
Task: "Create booking form component in packages/ui/components/booking/BookingForm.tsx"
Task: "Create booking confirmation component in packages/ui/components/booking/BookingConfirmation.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Schedule a Meeting)
   - Developer B: User Story 2 (Calendar Integration)
3. After US1/US2 complete:
   - Developer A: User Story 3 (Availability Blocks)
   - Developer B: User Story 4 (Video Conferencing)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Focus on simplifying existing Cal.com codebase rather than building from scratch
- Maintain compatibility with existing infrastructure (NextAuth, Prisma, tRPC) while removing non-core features

