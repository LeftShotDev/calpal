# Data Model: Minimal Scheduling Application

**Date**: 2025-12-16
**Feature**: Minimal Scheduling Application
**Based on**: [spec.md](./spec.md) and [research.md](./research.md)

## Overview

This document defines the core data entities for the minimal scheduling application. The model is simplified from Cal.com's original schema, focusing only on essential scheduling functionality.

## Core Entities

### Booking

Represents a scheduled meeting between a user and admin.

**Fields**:
- `id` (UUID, primary key)
- `userId` (UUID, foreign key to User) - Admin who owns this booking
- `title` (string, optional) - Meeting title/description
- `startTime` (DateTime, UTC) - Meeting start time in UTC
- `endTime` (DateTime, UTC) - Meeting end time in UTC
- `attendeeName` (string) - Name of person booking the meeting
- `attendeeEmail` (string) - Email of person booking the meeting
- `notes` (string, optional) - Optional meeting notes from attendee
- `videoProvider` (enum: 'google-meet' | 'zoom' | null) - Selected video platform
- `videoLink` (string, optional) - Video conferencing link (Google Meet or Zoom)
- `status` (enum: 'pending' | 'confirmed' | 'rejected' | 'cancelled') - Booking status
- `timezone` (string) - Timezone of the booking (e.g., "America/New_York")
- `calendarEventId` (string, optional) - Google Calendar event ID if synced
- `createdAt` (DateTime, UTC)
- `updatedAt` (DateTime, UTC)

**Relationships**:
- Belongs to `User` (admin)
- May reference `CalendarIntegration` (if created via calendar sync)

**Validation Rules**:
- `startTime` MUST be before `endTime`
- `attendeeEmail` MUST be valid email format
- `videoLink` MUST be present if `videoProvider` is set
- `startTime` and `endTime` MUST be in UTC
- `timezone` MUST be valid IANA timezone identifier

**State Transitions**:
- `pending` → `confirmed` (admin approves booking)
- `pending` → `rejected` (admin rejects booking)
- `confirmed` → `cancelled` (admin or system can cancel)
- `rejected` → (terminal state, cannot be reactivated)
- `cancelled` → (terminal state, cannot be reactivated)

**Indexes**:
- `userId` + `startTime` (for querying admin's bookings)
- `startTime` + `endTime` (for availability calculations)
- `status` (for filtering active bookings)

---

### AvailabilityBlock

Represents admin-defined time periods when meetings can be scheduled.

**Fields**:
- `id` (UUID, primary key)
- `userId` (UUID, foreign key to User) - Admin who owns this block
- `dayOfWeek` (integer, 0-6) - Day of week (0=Sunday, 6=Saturday)
- `startTime` (Time) - Start time (e.g., "09:00:00")
- `endTime` (Time) - End time (e.g., "17:00:00")
- `timezone` (string) - Timezone for this block (e.g., "America/New_York")
- `isActive` (boolean) - Whether this block is currently active
- `createdAt` (DateTime, UTC)
- `updatedAt` (DateTime, UTC)

**Relationships**:
- Belongs to `User` (admin)

**Validation Rules**:
- `dayOfWeek` MUST be between 0 and 6
- `startTime` MUST be before `endTime`
- `timezone` MUST be valid IANA timezone identifier
- Multiple blocks can exist for same `dayOfWeek` (handled as union)

**Indexes**:
- `userId` + `dayOfWeek` (for querying admin's availability)
- `userId` + `isActive` (for filtering active blocks)

---

### CalendarIntegration

Represents connection between admin's external calendar and the scheduling system.

**Fields**:
- `id` (UUID, primary key)
- `userId` (UUID, foreign key to User) - Admin who owns this integration
- `type` (enum: 'google-calendar') - Calendar provider type
- `accessToken` (encrypted string) - OAuth access token (encrypted)
- `refreshToken` (encrypted string, optional) - OAuth refresh token (encrypted)
- `tokenExpiresAt` (DateTime, UTC, optional) - When access token expires
- `calendarId` (string) - Calendar ID (e.g., "primary" for Google Calendar)
- `syncToken` (string, optional) - Google Calendar sync token for incremental sync
- `lastSyncAt` (DateTime, UTC, optional) - Last successful sync timestamp
- `syncStatus` (enum: 'active' | 'error' | 'disconnected') - Current sync status
- `syncError` (string, optional) - Last sync error message if any
- `createdAt` (DateTime, UTC)
- `updatedAt` (DateTime, UTC)

**Relationships**:
- Belongs to `User` (admin)
- Has many `CalendarEvent` (synced events)

**Validation Rules**:
- `type` MUST be 'google-calendar' (only supported type)
- `accessToken` MUST be encrypted at rest
- `refreshToken` MUST be encrypted at rest
- `syncStatus` MUST be one of: 'active', 'error', 'disconnected'

**State Transitions**:
- `disconnected` → `active` (on successful OAuth connection)
- `active` → `error` (on sync failure)
- `error` → `active` (on successful sync retry)
- `active` → `disconnected` (on admin disconnect)

**Indexes**:
- `userId` + `type` (for querying admin's calendar integrations)
- `syncStatus` (for finding integrations needing sync)

---

### CalendarEvent

Represents a synced event from external calendar (used for availability calculation).

**Fields**:
- `id` (UUID, primary key)
- `calendarIntegrationId` (UUID, foreign key to CalendarIntegration)
- `externalEventId` (string) - Event ID from external calendar (e.g., Google Calendar)
- `startTime` (DateTime, UTC) - Event start time in UTC
- `endTime` (DateTime, UTC) - Event end time in UTC
- `title` (string, optional) - Event title
- `isBusy` (boolean) - Whether this event marks time as busy (default: true)
- `syncedAt` (DateTime, UTC) - When this event was last synced
- `createdAt` (DateTime, UTC)
- `updatedAt` (DateTime, UTC)

**Relationships**:
- Belongs to `CalendarIntegration`

**Validation Rules**:
- `startTime` MUST be before `endTime`
- `externalEventId` MUST be unique per `calendarIntegrationId`
- `startTime` and `endTime` MUST be in UTC

**Indexes**:
- `calendarIntegrationId` + `startTime` (for querying events by integration and time)
- `externalEventId` + `calendarIntegrationId` (unique constraint)
- `startTime` + `endTime` (for availability overlap queries)

**Notes**:
- Events are synced incrementally using `syncToken`
- Old events are cleaned up periodically (events older than 90 days)
- Events are used to mark time slots as unavailable

---

### User

Represents an admin user (simplified from Cal.com's User model).

**Fields** (minimal subset needed):
- `id` (UUID, primary key)
- `username` (string, unique) - Username for public scheduling page URL
- `email` (string, unique) - User email
- `name` (string) - Display name
- `timezone` (string) - User's default timezone
- `createdAt` (DateTime, UTC)
- `updatedAt` (DateTime, UTC)

**Relationships**:
- Has many `Booking`
- Has many `AvailabilityBlock`
- Has one `CalendarIntegration` (one-to-one, but stored as has-many for future extensibility)

**Validation Rules**:
- `email` MUST be valid email format
- `username` MUST be URL-safe (alphanumeric + hyphens)
- `timezone` MUST be valid IANA timezone identifier

**Indexes**:
- `username` (unique, for public scheduling page lookup)
- `email` (unique, for authentication)

---

## Derived/Computed Entities

### TimeSlot

Represents a discrete time period available for booking. This is NOT stored in the database but computed on-demand.

**Computation Logic**:
1. Get all active `AvailabilityBlock` for admin
2. Convert blocks to UTC using admin's timezone
3. Generate time slots within each block (e.g., 30-minute intervals)
4. Get all `CalendarEvent` and `Booking` for the time period
5. Remove slots that overlap with events/bookings
6. Convert remaining slots to user's timezone for display

**Fields** (computed):
- `startTime` (DateTime, UTC) - Slot start time
- `endTime` (DateTime, UTC) - Slot end time
- `isAvailable` (boolean) - Whether slot is available
- `displayStartTime` (DateTime, user timezone) - For UI display
- `displayEndTime` (DateTime, user timezone) - For UI display

**Notes**:
- Time slots are computed on-demand, not stored
- Cached for 30 seconds to reduce computation load
- Cache invalidated when bookings are created or calendar sync occurs

---

## Data Relationships Diagram

```
User
├── has many Booking
├── has many AvailabilityBlock
└── has one CalendarIntegration
    └── has many CalendarEvent
```

---

## Database Schema Considerations

### Prisma Schema Location
- Existing schema: `packages/prisma/schema.prisma`
- Will be simplified to remove non-core entities

### Entities to Remove (from original Cal.com schema)
- Team/Organization entities
- Workflow entities
- Payment entities
- EventType (simplified - single default event type per admin)
- Webhook entities
- API key entities (unless needed for basic auth)
- Custom branding entities

### Entities to Keep (simplified)
- User (simplified)
- Booking (simplified)
- Availability (as AvailabilityBlock)
- Credential (as CalendarIntegration, simplified)

### Migration Strategy
1. Create new simplified schema alongside existing
2. Migrate data from old schema to new schema
3. Remove old schema entities
4. Update all code references

---

## Validation and Business Rules

### Booking Creation Rules
1. `startTime` MUST fall within an active `AvailabilityBlock`
2. `startTime` MUST NOT overlap with existing `Booking` (status: 'pending' | 'confirmed') - pending bookings reserve time slots
3. `startTime` MUST NOT overlap with `CalendarEvent` (isBusy: true)
4. `startTime` MUST be in the future (cannot book past times)
5. Minimum booking duration: 15 minutes
6. Maximum booking duration: 8 hours

### Availability Block Rules
1. Multiple blocks can exist for same `dayOfWeek` (union of available times)
2. Blocks can overlap (union is taken)
3. Blocks are converted to UTC for storage/comparison
4. Blocks respect DST changes automatically via timezone library

### Calendar Sync Rules
1. Sync runs every 5 minutes for active integrations
2. Incremental sync uses `syncToken` from previous sync
3. Full sync performed on first connection or if `syncToken` invalid
4. Events older than 90 days are cleaned up
5. Sync failures are logged and `syncStatus` set to 'error'

---

## Security Considerations

### Encryption
- `CalendarIntegration.accessToken` MUST be encrypted at rest
- `CalendarIntegration.refreshToken` MUST be encrypted at rest
- Use Cal.com's existing encryption utilities

### Access Control
- Users can only access their own `Booking`, `AvailabilityBlock`, `CalendarIntegration`
- Public scheduling pages are read-only (no authentication required)
- Admin pages require authentication

### Data Privacy
- `Booking.attendeeEmail` is PII - handle according to privacy requirements
- Calendar event data is synced but not stored long-term (90-day cleanup)

