# Quickstart Validation Checklist

**Purpose**: Verify that all setup steps from `quickstart.md` work correctly
**Date**: 2025-12-17

## Prerequisites Validation

- [ ] Node.js >= 18.x installed and accessible
- [ ] PostgreSQL running (local or Docker)
- [ ] Yarn 3.4.1 installed
- [ ] Google Cloud Project with Calendar API enabled
- [ ] Zoom Developer Account (optional, for Zoom integration)

## Initial Setup Validation

### 1. Repository Setup
- [ ] Repository cloned/available
- [ ] `yarn install` completes without errors
- [ ] `.env` file created from `.env.example`
- [ ] All required environment variables set

### 2. Database Setup
- [ ] `DATABASE_URL` configured correctly
- [ ] Database connection test successful
- [ ] `yarn prisma generate` completes successfully
- [ ] `yarn prisma db-migrate` runs without errors
- [ ] Database schema matches expected models:
  - [ ] Booking table exists with all required fields
  - [ ] AvailabilityBlock table exists
  - [ ] CalendarIntegration table exists
  - [ ] CalendarEvent table exists
  - [ ] All indexes created

### 3. Environment Variables Validation
- [ ] `NEXTAUTH_SECRET` set (32+ character string)
- [ ] `NEXTAUTH_URL` set correctly
- [ ] `CALENDSO_ENCRYPTION_KEY` set (32+ character string)
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `ZOOM_ACCOUNT_ID` set (if using Zoom)
- [ ] `ZOOM_CLIENT_ID` set (if using Zoom)
- [ ] `ZOOM_CLIENT_SECRET` set (if using Zoom)

## Application Startup Validation

### 4. Development Server
- [ ] `yarn dev` starts without errors
- [ ] Application accessible at `http://localhost:3000`
- [ ] No console errors on startup
- [ ] TypeScript compilation successful

### 5. Database Connection
- [ ] Application connects to database
- [ ] No database connection errors in logs
- [ ] Prisma client initialized correctly

## Feature Validation

### 6. User Story 1: Schedule a Meeting
- [ ] Public scheduling page accessible at `/schedule/[username]`
- [ ] Availability slots display correctly
- [ ] Booking form appears when slot selected
- [ ] Booking submission works
- [ ] Pending confirmation message displayed
- [ ] Admin can view bookings at `/bookings`
- [ ] Admin can approve bookings
- [ ] Admin can reject bookings
- [ ] Email notifications sent (check email service)

### 7. User Story 2: Calendar Integration
- [ ] Calendar settings page accessible at `/settings/integrations/calendar`
- [ ] "Connect Google Calendar" button works
- [ ] OAuth flow redirects to Google
- [ ] OAuth callback handles token exchange
- [ ] Calendar connection status displays
- [ ] Manual sync button works
- [ ] Calendar events sync correctly
- [ ] Busy times reflected in availability

### 8. User Story 3: Availability Blocks
- [ ] Availability blocks page accessible at `/settings/availability`
- [ ] Can create new availability block
- [ ] Can edit existing availability block
- [ ] Can delete availability block
- [ ] Availability blocks affect slot calculation
- [ ] Timezone handling works correctly

### 9. User Story 4: Video Conferencing
- [ ] Video provider selection appears in booking form
- [ ] Google Meet option available
- [ ] Zoom option available (if configured)
- [ ] Video link generated on booking approval
- [ ] Video link included in confirmation email
- [ ] Google Meet link works (opens meeting)
- [ ] Zoom link works (if configured, opens meeting)

## API Validation

### 10. Public Endpoints
- [ ] `GET /api/trpc/public.booking.getAvailability` returns slots
- [ ] `POST /api/trpc/public.booking.createBooking` creates booking
- [ ] Rate limiting works (test with >10 requests)

### 11. Authenticated Endpoints
- [ ] `GET /api/trpc/viewer.bookings.list` returns bookings
- [ ] `POST /api/trpc/viewer.bookings.approve` approves booking
- [ ] `POST /api/trpc/viewer.bookings.reject` rejects booking
- [ ] `GET /api/trpc/viewer.availability.blocks.list` returns blocks
- [ ] `POST /api/trpc/viewer.availability.blocks.create` creates block
- [ ] `PUT /api/trpc/viewer.availability.blocks.update` updates block
- [ ] `DELETE /api/trpc/viewer.availability.blocks.delete` deletes block
- [ ] `GET /api/trpc/viewer.calendar.getIntegration` returns status
- [ ] `POST /api/trpc/viewer.calendar.connect` initiates OAuth
- [ ] `POST /api/trpc/viewer.calendar.disconnect` disconnects calendar
- [ ] `POST /api/trpc/viewer.calendar.sync` syncs calendar

### 12. Cron Endpoints
- [ ] `GET /api/cron/data-retention` requires authentication
- [ ] Data retention job runs correctly (test manually)

## Performance Validation

### 13. Caching
- [ ] Availability calculations cached (check response times)
- [ ] Cache invalidates after 30 seconds
- [ ] Cache cleared on booking changes

### 14. Database Queries
- [ ] Queries use `select` instead of `include`
- [ ] No N+1 query issues
- [ ] Indexes used correctly

### 15. Bundle Size
- [ ] Dynamic imports load correctly
- [ ] Initial bundle size reasonable
- [ ] Code splitting works

## Error Handling Validation

### 16. Error Scenarios
- [ ] Invalid username shows error
- [ ] Booking conflicts handled gracefully
- [ ] Calendar sync errors logged
- [ ] Video link generation failures don't block booking
- [ ] Network errors handled gracefully
- [ ] Database errors logged appropriately

## Security Validation

### 17. Security Checks
- [ ] Rate limiting active on public endpoints
- [ ] Authentication required for admin endpoints
- [ ] Credentials encrypted in database
- [ ] OAuth tokens stored securely
- [ ] No sensitive data in logs

## Documentation Validation

### 18. Documentation
- [ ] `IMPLEMENTATION_STATUS.md` up to date
- [ ] `quickstart.md` steps accurate
- [ ] API endpoints documented
- [ ] Environment variables documented

## Notes

- Mark each item as complete after verification
- Note any issues or deviations from expected behavior
- Update documentation if steps need correction

## Test Data Setup

For comprehensive testing, create:
- [ ] Test user account
- [ ] Test availability blocks
- [ ] Test calendar integration
- [ ] Test bookings in various states

