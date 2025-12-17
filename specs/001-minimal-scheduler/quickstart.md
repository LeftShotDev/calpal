# Quick Start Guide: Minimal Scheduling Application

**Date**: 2025-12-16
**Feature**: Minimal Scheduling Application
**Purpose**: Get the minimal scheduling application running locally for development and testing

## Prerequisites

- Node.js >= 18.x
- PostgreSQL (running locally or via Docker)
- Yarn 3.4.1
- Google Cloud Project with Calendar API enabled (for calendar integration)
- Zoom Developer Account (for Zoom integration, optional)

## Initial Setup

### 1. Clone and Install

```bash
# Already in the forked repository
cd /path/to/sprint-02-calpal

# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and set the following (minimum required):

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/calpal?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Encryption
CALENDSO_ENCRYPTION_KEY="your-encryption-key"  # Generate with: openssl rand -base64 32

# Google Calendar OAuth (required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Zoom OAuth (optional, for Zoom integration)
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"
ZOOM_CLIENT_ACCOUNT_ID="your-zoom-account-id"  # For Server-to-Server OAuth
```

### 3. Database Setup

```bash
# Run migrations
yarn workspace @calcom/prisma db-deploy

# Seed database (creates initial admin user)
yarn workspace @calcom/prisma db-seed
```

**Note**: The seed script creates a default admin user. Check the seed file for credentials.

### 4. Start Development Server

```bash
# Start all services (web app + database)
yarn dx

# Or start individually:
yarn dev  # Starts Next.js dev server on http://localhost:3000
```

## First-Time Admin Setup

### 1. Login as Admin

1. Open http://localhost:3000
2. Login with the admin credentials from seed data
3. You'll be redirected to the admin dashboard

### 2. Connect Google Calendar

1. Navigate to **Settings** → **Integrations** → **Calendar**
2. Click **Connect Google Calendar**
3. Complete OAuth flow (authorize access to your Google Calendar)
4. Calendar sync will begin automatically
5. Verify sync status shows "Active" and last sync time

### 3. Configure Availability Blocks

1. Navigate to **Settings** → **Availability**
2. Click **Add Availability Block**
3. Configure:
   - **Day of Week**: Select day(s) (e.g., Monday-Friday)
   - **Start Time**: e.g., 09:00
   - **End Time**: e.g., 17:00
   - **Timezone**: Your timezone (e.g., America/New_York)
4. Click **Save**
5. Repeat for different days/time ranges as needed

### 4. Configure Video Conferencing (Optional)

1. Navigate to **Settings** → **Integrations** → **Video**
2. For Zoom: Click **Connect Zoom** and complete OAuth flow
3. Set default video platform (Google Meet or Zoom)
4. Google Meet works automatically once Google Calendar is connected

## Testing the Scheduling Flow

### 1. Get Your Public Scheduling URL

1. In admin dashboard, go to **Settings** → **Profile**
2. Note your **Username** (e.g., "admin")
3. Your public scheduling URL is: `http://localhost:3000/[username]`

### 2. Test Booking as User

1. Open the public scheduling URL in an incognito/private window
2. You should see available time slots (based on your availability blocks and calendar)
3. Select an available time slot
4. Fill in booking form:
   - Name: Test User
   - Email: test@example.com
   - Notes: Optional
   - Video: Select Google Meet or Zoom (if configured)
5. Click **Book Meeting**
6. You should receive a confirmation message
7. Check your email for confirmation (if email is configured)

### 3. Verify Booking in Admin Dashboard

1. Return to admin dashboard
2. Navigate to **Bookings**
3. You should see the test booking
4. Verify it appears in your Google Calendar (if connected)

## Development Workflow

### Running Tests

```bash
# Unit tests
yarn test

# Integration tests
yarn test -- --integrationTestsOnly

# E2E tests (requires dev server running)
yarn e2e
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
yarn prisma studio

# Create new migration
yarn workspace @calcom/prisma db-migrate

# Reset database (WARNING: deletes all data)
yarn workspace @calcom/prisma db-reset
```

### Code Quality

```bash
# Type check
yarn type-check

# Lint
yarn lint:fix

# Format
yarn format
```

## Common Issues

### Calendar Sync Not Working

1. Check OAuth token is valid (Settings → Integrations → Calendar)
2. Verify Google Calendar API is enabled in Google Cloud Console
3. Check sync status shows "Active" (not "Error")
4. Manually trigger sync: Settings → Integrations → Calendar → Sync Now

### No Available Time Slots Showing

1. Verify availability blocks are configured (Settings → Availability)
2. Check availability blocks are active (`isActive: true`)
3. Verify time range includes current/future dates
4. Check calendar sync is working (no conflicting events)

### Video Links Not Generating

1. **Google Meet**: Requires Google Calendar to be connected
2. **Zoom**: Requires Zoom integration to be configured (Settings → Integrations → Video)
3. Check browser console for API errors
4. Verify OAuth tokens are valid

### Database Connection Issues

1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` in `.env` is correct
3. Verify database exists: `psql -l | grep calpal`
4. Try resetting database: `yarn workspace @calcom/prisma db-reset`

## Next Steps

- Review [data-model.md](./data-model.md) for data structure
- Review [contracts/trpc-procedures.md](./contracts/trpc-procedures.md) for API endpoints
- Review [research.md](./research.md) for technical decisions
- Start implementing features per [tasks.md](./tasks.md) (to be generated)

## Architecture Overview

```
┌─────────────────────────────────────┐
│   Public Scheduling Page            │
│   (No auth required)                │
│   /[username]                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   tRPC API Layer                    │
│   - public.booking.*                │
│   - availability.*                  │
│   - bookings.*                      │
│   - calendar.*                      │
│   - video.*                         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Service Layer                     │
│   - BookingService                  │
│   - AvailabilityService              │
│   - CalendarSyncService             │
│   - VideoService                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Repository Layer                  │
│   - Prisma ORM                      │
│   - PostgreSQL                      │
└─────────────────────────────────────┘
```

## Key Files

- **Frontend**: `apps/web/app/` (Next.js App Router)
- **API**: `packages/trpc/server/routers/`
- **Database**: `packages/prisma/schema.prisma`
- **Services**: `packages/features/*/`
- **UI Components**: `packages/ui/components/`

## Resources

- [Cal.com Development Guide](../agents/README.md)
- [tRPC Documentation](https://trpc.io)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Zoom API](https://developers.zoom.us/docs/api/)

