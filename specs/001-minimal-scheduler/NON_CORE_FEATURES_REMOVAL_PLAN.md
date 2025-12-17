# Non-Core Features Removal Plan

**Task**: T078 - Remove non-core features (workflows, payments, teams, advanced notifications)
**Status**: Documented for future implementation
**Approach**: Gradual removal with feature flags to avoid breaking changes

## Overview

The minimal scheduler should only include core scheduling functionality. The following features are considered non-core and should be removed or disabled:

1. **Workflows** - Automated workflow triggers and actions
2. **Payments** - Payment processing and billing
3. **Teams** - Team/organization management
4. **Advanced Notifications** - Complex notification systems beyond basic email

## Current Usage Analysis

### tRPC Routers (packages/trpc/server/routers/viewer/_router.tsx)

**Non-core routers currently registered:**
- `workflowsRouter` - Line 46, 70
- `paymentsRouter` - Line 35, 75
- `viewerTeamsRouter` - Line 41, 63
- `viewerOrganizationsRouter` - Line 34, 65

**Impact**: These routers are registered but may not be used by minimal scheduler features.

### Database Models (packages/prisma/schema.prisma)

**Non-core models to consider removing:**
- `Team` - Team management
- `Workflow` - Workflow definitions
- `WorkflowStep` - Workflow steps
- `WorkflowReminder` - Workflow reminders
- `Payment` - Payment records
- `EventType` - Complex event type system (minimal scheduler uses simple bookings)
- `Webhook` - Webhook subscriptions
- `Membership` - Team memberships
- `Organization` - Organization management

**Note**: Some models may have foreign key relationships that need careful handling.

### Feature Packages

**Packages that could be removed or disabled:**
- `packages/features/ee/workflows/` - Workflow system
- `packages/features/payments/` - Payment processing
- `packages/features/ee/teams/` - Team management
- `packages/features/ee/organizations/` - Organization management
- `packages/features/webhooks/` - Webhook system (if not needed)

## Removal Strategy

### Phase 1: Disable via Feature Flags (Safest)

1. Create feature flags for non-core features
2. Conditionally register routers based on flags
3. Hide UI components based on flags
4. Test that core features still work

**Pros**:
- Reversible
- No breaking changes
- Can be done incrementally

**Cons**:
- Code still in bundle
- Doesn't achieve full bundle size reduction

### Phase 2: Conditional Imports (Medium Risk)

1. Use dynamic imports for non-core features
2. Only load when explicitly needed
3. Remove from main bundle

**Pros**:
- Reduces bundle size
- Still reversible

**Cons**:
- More complex import structure
- Runtime checks needed

### Phase 3: Complete Removal (Highest Risk)

1. Remove router registrations
2. Remove database models (with migrations)
3. Remove feature packages
4. Update all imports

**Pros**:
- Maximum bundle size reduction
- Cleaner codebase

**Cons**:
- Breaking changes
- Requires comprehensive testing
- May break other parts of Cal.com if not careful

## Recommended Approach

**For Minimal Scheduler MVP**: Use Phase 1 (Feature Flags)

1. Add environment variable: `ENABLE_NON_CORE_FEATURES=false`
2. Conditionally register routers:
   ```typescript
   export const viewerRouter = router({
     // Core features always included
     bookings: bookingsRouter,
     calendar: calendarRouter,
     availability: availabilityRouter,
     video: videoRouter,

     // Non-core features conditionally included
     ...(process.env.ENABLE_NON_CORE_FEATURES === "true" ? {
       workflows: workflowsRouter,
       payments: paymentsRouter,
       teams: viewerTeamsRouter,
       organizations: viewerOrganizationsRouter,
     } : {}),
   });
   ```

3. Hide UI navigation items for disabled features
4. Test all core features work correctly

**For Future Optimization**: Move to Phase 2 or 3 after MVP is stable

## Files to Modify

### High Priority (Core Functionality)
- `packages/trpc/server/routers/viewer/_router.tsx` - Conditional router registration
- `apps/web/app/(use-page-wrapper)/(main-nav)/layout.tsx` - Hide navigation items

### Medium Priority (UI Cleanup)
- Remove workflow/payment/team pages from navigation
- Remove related settings pages
- Clean up unused UI components

### Low Priority (Deep Cleanup)
- Remove unused database models (requires migration)
- Remove feature packages (requires dependency cleanup)
- Update documentation

## Testing Checklist

After implementing removal:

- [ ] Core booking flow works
- [ ] Calendar integration works
- [ ] Availability blocks work
- [ ] Video conferencing works
- [ ] No errors in console
- [ ] Bundle size reduced (measure before/after)
- [ ] All tests pass
- [ ] No broken imports

## Notes

- **Do not remove** until all core features are stable
- **Test thoroughly** after each phase
- **Keep removal reversible** initially (feature flags)
- **Document** what was removed and why
- **Measure** bundle size reduction to verify improvements

## Current Status

- **Status**: Documented, not implemented
- **Reason**: Large refactoring task that could break core functionality
- **Recommendation**: Defer until MVP is fully tested and stable
- **Alternative**: Use feature flags to disable non-core features without removing code

