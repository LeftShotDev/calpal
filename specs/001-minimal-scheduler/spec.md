# Feature Specification: Minimal Scheduling Application

**Feature Branch**: `001-minimal-scheduler`
**Created**: 2025-12-16
**Status**: Draft
**Input**: User description: "Create specifications for a minimal scheduling application forked from @calcom/cal.com. The application shall adhere to the following: Core User Features: Allow users to schedule a meeting (basic scheduling interface only). Connect scheduled meetings to provided calendars (Google or similar). Interactive scheduling with time zones accounted for automatically. Core Admin Features: Add and manage calendar integrations (support for Google Calendar or related). Define blocks of time when meetings can be scheduled (admin-configurable time blocks). Remove all non-core features, such as resource scheduling, workflows, notifications beyond essentials (avoid clutter). Functional Scope and Constraints: 1. Google Meet and Zoom must be the only supported external videoconferencing platforms. 2. Obsolete any features that require extra integrations for alternative platforms (e.g., Webex, MS Teams support). 3. Frontend: Simplify UI/UX compared original for fast performance. 4 Backend optimized sync cleaner token-based event extension simplified API sin-queryloop-buffer slow leading (refactor redundant Cal pattern utilize)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Schedule a Meeting (Priority: P1)

A user visits a scheduling page and selects an available time slot to book a meeting with an admin. The system displays available time slots based on the admin's configured availability blocks and calendar integration, automatically accounting for time zones. The user completes the booking by providing basic contact information and receives confirmation.

**Why this priority**: This is the core value proposition of the application. Without the ability to schedule meetings, the application has no purpose. This story delivers complete end-to-end value independently.

**Independent Test**: Can be fully tested by having a user visit a scheduling page, view available time slots, select a time, provide contact information, and receive a booking confirmation. This delivers immediate value: a meeting is scheduled and appears in the admin's calendar.

**Acceptance Scenarios**:

1. **Given** an admin has configured availability blocks and connected their Google Calendar, **When** a user visits the scheduling page, **Then** the user sees available time slots displayed in their local timezone
2. **Given** a user is viewing available time slots, **When** the user selects an available time slot, **Then** the user is presented with a booking form
3. **Given** a user is filling out the booking form, **When** the user provides name, email, and optional meeting notes, **Then** the user can submit the booking
4. **Given** a user submits a booking, **When** the booking is confirmed, **Then** the user receives a confirmation message and the meeting appears in the admin's calendar
5. **Given** a user selects a time slot that becomes unavailable (e.g., admin books it directly), **When** the user attempts to book, **Then** the user is notified the slot is no longer available and shown updated availability

---

### User Story 2 - Admin Calendar Integration (Priority: P1)

An admin connects their Google Calendar to the scheduling application. The system syncs calendar events to determine real-time availability. The admin can view their connected calendar status and disconnect/reconnect as needed.

**Why this priority**: Calendar integration is essential for accurate availability display. Without it, users cannot see when admins are actually available, making the scheduling feature unreliable. This story enables the core scheduling functionality.

**Independent Test**: Can be fully tested by having an admin authenticate with Google Calendar, verify the connection status, and confirm that calendar events are being read to determine availability. This delivers immediate value: the system knows when the admin is busy.

**Acceptance Scenarios**:

1. **Given** an admin is logged into the application, **When** the admin navigates to calendar integration settings, **Then** the admin sees options to connect Google Calendar
2. **Given** an admin initiates Google Calendar connection, **When** the admin completes OAuth authentication, **Then** the calendar is connected and syncing begins
3. **Given** a calendar is connected, **When** the admin views calendar settings, **Then** the admin sees connection status and last sync time
4. **Given** a calendar is connected, **When** the admin disconnects the calendar, **Then** the connection is removed and availability is no longer updated from that calendar
5. **Given** calendar events exist in the connected calendar, **When** the system syncs, **Then** those time slots are marked as unavailable for scheduling

---

### User Story 3 - Admin Availability Block Management (Priority: P2)

An admin defines time blocks when meetings can be scheduled. These blocks can be set for specific days of the week and time ranges. The admin can create, edit, and delete availability blocks. The system uses these blocks in combination with calendar events to determine available time slots.

**Why this priority**: While calendar integration provides real-time availability, admins need control over when they accept bookings. Availability blocks allow admins to set business hours, preferred meeting times, and other scheduling preferences. This story enables admins to customize their scheduling availability.

**Independent Test**: Can be fully tested by having an admin create availability blocks (e.g., Monday-Friday 9am-5pm), verify they appear in settings, edit them, and confirm that only times within these blocks are shown as available to users. This delivers immediate value: admins control when they accept bookings.

**Acceptance Scenarios**:

1. **Given** an admin is logged into the application, **When** the admin navigates to availability settings, **Then** the admin sees existing availability blocks and options to create new ones
2. **Given** an admin creates a new availability block, **When** the admin sets day(s) of week, start time, end time, and timezone, **Then** the block is saved and active
3. **Given** availability blocks exist, **When** a user views the scheduling page, **Then** only time slots within active availability blocks are shown as available
4. **Given** an admin has multiple availability blocks, **When** blocks overlap or conflict, **Then** the system handles them appropriately (union of available times)
5. **Given** an admin edits an availability block, **When** the admin changes the time range, **Then** the changes are saved and immediately reflected in scheduling availability
6. **Given** an admin deletes an availability block, **When** the deletion is confirmed, **Then** the block is removed and no longer affects availability

---

### User Story 4 - Video Conferencing Integration (Priority: P2)

When scheduling a meeting, users can select Google Meet or Zoom as the video conferencing option. The system generates the appropriate meeting link based on the selected platform. The meeting link is included in booking confirmations and calendar events.

**Why this priority**: Video conferencing is a common requirement for modern scheduling. Supporting both Google Meet and Zoom covers the majority of use cases while maintaining simplicity. This story enhances the core scheduling value by enabling remote meetings.

**Independent Test**: Can be fully tested by having a user schedule a meeting with Google Meet selected, receiving a confirmation with a Google Meet link, and verifying the link works. Then repeating with Zoom. This delivers immediate value: users can join meetings remotely.

**Acceptance Scenarios**:

1. **Given** a user is scheduling a meeting, **When** the user selects Google Meet as the video option, **Then** a Google Meet link is generated and included in the booking
2. **Given** a user is scheduling a meeting, **When** the user selects Zoom as the video option, **Then** a Zoom meeting link is generated and included in the booking
3. **Given** a user schedules a meeting with video conferencing, **When** the booking is confirmed, **Then** the video link is included in both user confirmation and calendar event
4. **Given** an admin has configured video conferencing preferences, **When** users schedule meetings, **Then** the default video platform is used unless overridden
5. **Given** video conferencing is optional, **When** a user schedules without selecting video, **Then** the booking completes successfully without a video link

---

### Edge Cases

- What happens when an admin has no availability blocks configured? (System should show no available times or use default business hours)
- How does the system handle timezone changes for recurring availability blocks? (Blocks should maintain their local time interpretation)
- What happens when calendar sync fails? (System should show last known availability and indicate sync status)
- How does the system handle overlapping calendar events and availability blocks? (Calendar events take precedence - if busy, slot unavailable)
- What happens when a user attempts to book a time slot that was just booked by another user? (System should detect conflict and show updated availability)
- How does the system handle admin timezone vs user timezone? (All times displayed in user's local timezone, converted from admin's timezone)
- What happens when Google Calendar OAuth token expires? (System should prompt admin to reconnect)
- How does the system handle multiple admins or team scenarios? (Out of scope for MVP - single admin only)
- What happens when video conferencing platform API is unavailable? (Booking should complete without video link, with notification to admin)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to view available time slots for scheduling without authentication
- **FR-002**: System MUST display available time slots in the user's local timezone, automatically detected or manually selected
- **FR-003**: System MUST allow users to select an available time slot and provide name, email, and optional meeting notes to book a meeting
- **FR-004**: System MUST send booking confirmation to users via email upon successful booking
- **FR-005**: System MUST create calendar events in the admin's connected Google Calendar for all confirmed bookings
- **FR-006**: System MUST support Google Calendar integration via OAuth2 authentication
- **FR-007**: System MUST sync calendar events from connected Google Calendar to determine real-time availability
- **FR-008**: System MUST allow admins to connect and disconnect Google Calendar integrations
- **FR-009**: System MUST allow admins to create, edit, and delete availability blocks with day of week, time range, and timezone settings
- **FR-010**: System MUST use availability blocks in combination with calendar events to determine available time slots
- **FR-011**: System MUST support Google Meet video conferencing integration
- **FR-012**: System MUST support Zoom video conferencing integration
- **FR-013**: System MUST allow users to select video conferencing platform (Google Meet or Zoom) when scheduling
- **FR-014**: System MUST generate and include video conferencing links in booking confirmations and calendar events
- **FR-015**: System MUST prevent double-booking of the same time slot
- **FR-016**: System MUST update availability in real-time as bookings are made
- **FR-017**: System MUST handle timezone conversions automatically for all scheduling operations
- **FR-018**: System MUST remove all features not essential to core scheduling functionality (workflows, resource scheduling, advanced notifications, etc.)
- **FR-019**: System MUST provide a simplified, performant user interface compared to the original Cal.com application
- **FR-020**: System MUST optimize backend synchronization to avoid query loops and improve performance

### Key Entities *(include if feature involves data)*

- **Booking**: Represents a scheduled meeting between a user and admin. Contains: user name, email, meeting time, duration, optional notes, video conferencing link (if selected), status (confirmed/cancelled), timezone information
- **Availability Block**: Represents admin-defined time periods when meetings can be scheduled. Contains: day(s) of week, start time, end time, timezone, active status
- **Calendar Integration**: Represents connection between admin's external calendar and the scheduling system. Contains: provider type (Google Calendar), OAuth token, sync status, last sync timestamp
- **Time Slot**: Represents a discrete time period available for booking. Derived from availability blocks minus calendar events. Contains: start time, end time, timezone, availability status

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a meeting booking in under 2 minutes from viewing available times to receiving confirmation
- **SC-002**: System displays available time slots within 1 second of page load
- **SC-003**: Calendar synchronization completes within 30 seconds of admin connecting calendar
- **SC-004**: 95% of bookings are successfully created and appear in admin's calendar within 1 minute
- **SC-005**: System handles timezone conversions accurately for 100% of bookings across all major timezones
- **SC-006**: Application bundle size is reduced by at least 40% compared to original Cal.com codebase
- **SC-007**: Page load performance improves by at least 50% compared to original Cal.com interface
- **SC-008**: 90% of users successfully complete booking on first attempt without requiring support
- **SC-009**: Admin can configure availability blocks and calendar integration without technical assistance
- **SC-010**: System maintains 99.5% uptime for scheduling functionality during business hours
