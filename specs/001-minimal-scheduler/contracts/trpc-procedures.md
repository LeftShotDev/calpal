# tRPC API Contracts: Minimal Scheduling Application

**Date**: 2025-12-16
**Feature**: Minimal Scheduling Application
**API Type**: tRPC (Type-safe RPC)

## Overview

This document defines the tRPC procedures (endpoints) for the minimal scheduling application. All procedures are type-safe and use Zod for input validation.

## Router Structure

```
trpc/
└── server/
    └── routers/
        ├── public/          # Public endpoints (no auth required)
        │   └── booking/     # Public booking endpoints
        ├── availability/    # Availability block management
        ├── bookings/        # Booking management (admin)
        ├── calendar/        # Calendar integration management
        └── video/           # Video conferencing endpoints
```

---

## Public Router (`public.booking`)

### `getAvailability`

Get available time slots for a given admin user.

**Input** (Zod schema):
```typescript
{
  username: string;           // Admin username (from URL)
  startDate: string;          // ISO date string (YYYY-MM-DD)
  endDate: string;            // ISO date string (YYYY-MM-DD)
  timezone?: string;          // Optional: user's timezone (IANA format)
}
```

**Output**:
```typescript
{
  slots: Array<{
    startTime: string;        // ISO datetime string (UTC)
    endTime: string;          // ISO datetime string (UTC)
    displayStartTime: string; // ISO datetime string (user timezone)
    displayEndTime: string;    // ISO datetime string (user timezone)
    isAvailable: boolean;
  }>;
  adminTimezone: string;      // Admin's timezone
}
```

**Errors**:
- `NOT_FOUND`: Admin user not found
- `BAD_REQUEST`: Invalid date range or timezone

---

### `createBooking`

Create a new booking (public, no auth required).

**Input** (Zod schema):
```typescript
{
  username: string;           // Admin username
  startTime: string;         // ISO datetime string (UTC)
  endTime: string;           // ISO datetime string (UTC)
  attendeeName: string;       // Min 1 char, max 100 chars
  attendeeEmail: string;      // Valid email format
  notes?: string;            // Optional, max 500 chars
  videoProvider?: 'google-meet' | 'zoom'; // Optional video platform
  timezone: string;          // User's timezone (IANA format)
}
```

**Output**:
```typescript
{
  bookingId: string;         // UUID
  status: 'confirmed';
  videoLink?: string;        // If videoProvider was selected
  confirmationMessage: string;
}
```

**Errors**:
- `NOT_FOUND`: Admin user not found
- `BAD_REQUEST`: Invalid time slot, email, or timezone
- `CONFLICT`: Time slot no longer available (double-booking)
- `INTERNAL_SERVER_ERROR`: Video link generation failed (booking still created)

**Business Logic**:
- Validates time slot is available
- Creates booking atomically (prevents double-booking)
- Generates video link if videoProvider specified
- Creates calendar event in admin's Google Calendar
- Sends confirmation email to attendee

---

## Availability Router (`availability`)

### `list`

Get all availability blocks for authenticated admin.

**Input**: None (uses authenticated user from session)

**Output**:
```typescript
{
  blocks: Array<{
    id: string;
    dayOfWeek: number;        // 0-6 (Sunday-Saturday)
    startTime: string;        // Time string (HH:MM:SS)
    endTime: string;         // Time string (HH:MM:SS)
    timezone: string;
    isActive: boolean;
  }>;
}
```

**Auth**: Required (admin only)

---

### `create`

Create a new availability block.

**Input** (Zod schema):
```typescript
{
  dayOfWeek: number;         // 0-6 (Sunday-Saturday)
  startTime: string;          // Time string (HH:MM:SS)
  endTime: string;           // Time string (HH:MM:SS)
  timezone: string;          // IANA timezone identifier
}
```

**Output**:
```typescript
{
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  isActive: boolean;
}
```

**Auth**: Required (admin only)

**Errors**:
- `BAD_REQUEST`: Invalid dayOfWeek, time range, or timezone
- `UNAUTHORIZED`: Not authenticated

---

### `update`

Update an existing availability block.

**Input** (Zod schema):
```typescript
{
  id: string;                // Availability block ID
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  isActive?: boolean;
}
```

**Output**: Same as `create`

**Auth**: Required (admin only)

**Errors**:
- `NOT_FOUND`: Availability block not found or not owned by user
- `BAD_REQUEST`: Invalid input values
- `UNAUTHORIZED`: Not authenticated

---

### `delete`

Delete an availability block.

**Input** (Zod schema):
```typescript
{
  id: string;                // Availability block ID
}
```

**Output**:
```typescript
{
  success: boolean;
}
```

**Auth**: Required (admin only)

**Errors**:
- `NOT_FOUND`: Availability block not found or not owned by user
- `UNAUTHORIZED`: Not authenticated

---

## Bookings Router (`bookings`)

### `list`

Get all bookings for authenticated admin.

**Input** (Zod schema):
```typescript
{
  startDate?: string;        // Optional: ISO date string
  endDate?: string;          // Optional: ISO date string
  status?: 'confirmed' | 'cancelled';
}
```

**Output**:
```typescript
{
  bookings: Array<{
    id: string;
    startTime: string;       // ISO datetime (UTC)
    endTime: string;         // ISO datetime (UTC)
    attendeeName: string;
    attendeeEmail: string;
    notes?: string;
    videoProvider?: 'google-meet' | 'zoom';
    videoLink?: string;
    status: 'confirmed' | 'cancelled';
    timezone: string;
  }>;
}
```

**Auth**: Required (admin only)

---

### `get`

Get a single booking by ID.

**Input** (Zod schema):
```typescript
{
  id: string;                // Booking ID
}
```

**Output**: Single booking object (same structure as in `list`)

**Auth**: Required (admin only)

**Errors**:
- `NOT_FOUND`: Booking not found or not owned by user
- `UNAUTHORIZED`: Not authenticated

---

### `cancel`

Cancel a booking.

**Input** (Zod schema):
```typescript
{
  id: string;                // Booking ID
  reason?: string;           // Optional cancellation reason
}
```

**Output**:
```typescript
{
  id: string;
  status: 'cancelled';
}
```

**Auth**: Required (admin only)

**Business Logic**:
- Updates booking status to 'cancelled'
- Removes calendar event from Google Calendar
- Cancels Zoom meeting if applicable
- Sends cancellation email to attendee

**Errors**:
- `NOT_FOUND`: Booking not found or not owned by user
- `BAD_REQUEST`: Booking already cancelled
- `UNAUTHORIZED`: Not authenticated

---

## Calendar Router (`calendar`)

### `getIntegration`

Get calendar integration status for authenticated admin.

**Input**: None (uses authenticated user)

**Output**:
```typescript
{
  integration: {
    id: string;
    type: 'google-calendar';
    calendarId: string;
    syncStatus: 'active' | 'error' | 'disconnected';
    lastSyncAt?: string;     // ISO datetime
    syncError?: string;
  } | null;
}
```

**Auth**: Required (admin only)

---

### `connect`

Initiate Google Calendar OAuth connection.

**Input**: None (OAuth flow handled separately)

**Output**:
```typescript
{
  authUrl: string;           // OAuth authorization URL
}
```

**Auth**: Required (admin only)

**Business Logic**:
- Generates OAuth authorization URL
- Stores OAuth state for verification
- Redirects user to Google OAuth consent screen

---

### `callback`

Handle OAuth callback from Google Calendar.

**Input** (Zod schema):
```typescript
{
  code: string;              // OAuth authorization code
  state: string;             // OAuth state (for CSRF protection)
}
```

**Output**:
```typescript
{
  integration: {
    id: string;
    type: 'google-calendar';
    syncStatus: 'active';
  };
}
```

**Auth**: Required (admin only)

**Business Logic**:
- Exchanges authorization code for access/refresh tokens
- Stores encrypted tokens
- Performs initial calendar sync
- Creates CalendarIntegration record

**Errors**:
- `BAD_REQUEST`: Invalid OAuth code or state
- `INTERNAL_SERVER_ERROR`: Token exchange or sync failed

---

### `disconnect`

Disconnect calendar integration.

**Input**: None (uses authenticated user)

**Output**:
```typescript
{
  success: boolean;
}
```

**Auth**: Required (admin only)

**Business Logic**:
- Removes CalendarIntegration record
- Cleans up synced CalendarEvent records
- Invalidates OAuth tokens

**Errors**:
- `NOT_FOUND`: No integration found for user
- `UNAUTHORIZED`: Not authenticated

---

### `sync`

Manually trigger calendar sync (admin-initiated).

**Input**: None (uses authenticated user)

**Output**:
```typescript
{
  success: boolean;
  eventsSynced: number;
  lastSyncAt: string;        // ISO datetime
}
```

**Auth**: Required (admin only)

**Business Logic**:
- Performs incremental sync using stored `syncToken`
- Updates CalendarEvent records
- Updates `lastSyncAt` and `syncStatus`

**Errors**:
- `NOT_FOUND`: No integration found for user
- `INTERNAL_SERVER_ERROR`: Sync failed (updates `syncStatus` to 'error')

---

## Video Router (`video`)

### `generateGoogleMeetLink`

Generate a Google Meet link for a booking.

**Input** (Zod schema):
```typescript
{
  bookingId: string;
}
```

**Output**:
```typescript
{
  videoLink: string;         // Google Meet URL
}
```

**Auth**: Required (admin only) or public (if booking is public)

**Business Logic**:
- Creates calendar event with `conferenceData`
- Extracts Google Meet link from event
- Updates booking with video link

**Errors**:
- `NOT_FOUND`: Booking not found
- `BAD_REQUEST`: Booking already has video link
- `INTERNAL_SERVER_ERROR`: Google Calendar API error

---

### `generateZoomLink`

Generate a Zoom meeting link for a booking.

**Input** (Zod schema):
```typescript
{
  bookingId: string;
}
```

**Output**:
```typescript
{
  videoLink: string;         // Zoom meeting URL
}
```

**Auth**: Required (admin only) or public (if booking is public)

**Business Logic**:
- Creates Zoom meeting via Zoom API
- Stores meeting details
- Updates booking with video link

**Errors**:
- `NOT_FOUND`: Booking not found or Zoom integration not configured
- `BAD_REQUEST`: Booking already has video link
- `INTERNAL_SERVER_ERROR`: Zoom API error

---

## Error Response Format

All errors follow tRPC error format:

```typescript
{
  code: string;              // Error code (e.g., 'NOT_FOUND', 'BAD_REQUEST')
  message: string;           // Human-readable error message
  data?: {
    // Additional error context
  };
}
```

**Standard Error Codes**:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input
- `CONFLICT`: Resource conflict (e.g., double-booking)
- `INTERNAL_SERVER_ERROR`: Server error

---

## Authentication

- **Public endpoints**: `public.booking.*` - No authentication required
- **Admin endpoints**: All other routers - Require NextAuth.js session
- **Session validation**: Performed by tRPC middleware
- **User context**: Available via `ctx.session.user` in procedures

---

## Rate Limiting

- Public booking creation: 10 requests per IP per hour
- Calendar sync: 1 request per admin per minute
- All other endpoints: Standard rate limits (TBD)

---

## Notes

- All datetime values are ISO 8601 strings
- All timezone values are IANA timezone identifiers (e.g., "America/New_York")
- Input validation uses Zod schemas
- Output types are inferred from Zod schemas for type safety
- Error handling follows tRPC conventions

