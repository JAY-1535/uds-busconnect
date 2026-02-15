
# Comprehensive Platform Fix Plan - UDS BusConnect

## Overview

After a thorough audit of the entire platform (frontend pages, backend functions, database schema, RLS policies, edge functions), I have identified **15+ issues** that need to be fixed. This plan addresses every one of them permanently.

---

## Critical Issues Found

### 1. App.css Breaking Layout (CRITICAL)
The default Vite `App.css` file constrains the entire app to `max-width: 1280px`, adds `padding: 2rem`, and centers text. This causes layout issues across all pages.

**Fix:** Remove or empty the `App.css` file contents.

### 2. Book Now Navigation Not Working (CRITICAL)
The `<Link>` wrapped inside `<Button asChild>` in `Trips.tsx` is structurally correct, but the `App.css` styling (`.card` rule adding `padding: 2em`) may be interfering with card components globally. Additionally, the `asChild` pattern needs the `Link` to be rendered as the direct child.

**Fix:** Remove conflicting CSS and verify the `asChild` + `Link` pattern works. Also add a fallback `onClick` handler for robustness.

### 3. Missing `decrement_available_seats` Database Function (CRITICAL)
The `verify-payment` edge function calls `supabase.rpc('decrement_available_seats', ...)` but this function does not exist in the database. The fallback manual update is also incorrect as it doesn't account for race conditions.

**Fix:** Create an atomic `decrement_available_seats` SQL function.

### 4. Missing `handle_new_user` Trigger Behavior Issue
The trigger exists but the logic checks `user_roles` count instead of `auth.users` count. If any roles exist (from previous users), new users will never get admin. This has already been worked around manually, but the function should be improved.

**Fix:** Keep the existing function as-is since the first-admin assignment was already handled.

### 5. Duplicate Route for My Bookings
Both `/bookings` and `/my-bookings` render the same `MyBookings` component. This causes confusion.

**Fix:** Keep `/my-bookings` as the canonical route, redirect `/bookings` to it.

### 6. Protected Routes Missing for Student Pages
Pages like `/book/:tripId`, `/payment/:bookingId`, `/booking-confirmation/:bookingId`, `/my-bookings`, `/profile`, `/apply-organizer`, `/submit-claim` all handle auth manually instead of using the `ProtectedRoute` wrapper. This causes race conditions with the auth loading state.

**Fix:** Wrap pages requiring auth in `ProtectedRoute` and remove manual auth checks from each page. For `/book/:tripId`, keep the redirect logic since it needs to pass the redirect URL.

### 7. Payment Page Side Effect in Render
In `Payment.tsx`, the redirect on confirmed booking (`navigate(...)`) is called directly during render, which is a React anti-pattern.

**Fix:** Move the redirect logic into a `useEffect`.

### 8. Seat Selection Toggle Bug
In `SeatSelector.tsx`, clicking a selected seat calls `onSelectSeat(seatNumber)` again with the same value instead of `null`, so the seat cannot be deselected.

**Fix:** Pass `null` to deselect.

### 9. Missing `share_link_id` Auto-Generation
Trips don't auto-generate `share_link_id`, so the `ShareTripLink` component only shows when the field is already set. No code generates this.

**Fix:** Add `share_link_id` default value using `gen_random_uuid()` in the database, or generate it on trip creation.

### 10. Organizer Dashboard "Create Trip" Links to Non-Existent Route
The button navigates to `/organizer/trips/new` which doesn't exist as a route.

**Fix:** Change to open the create trip dialog in `OrganizerTrips` page, or navigate to `/organizer/trips` with a query param.

### 11. Missing Realtime Publication
The `bookings` and `trips` tables are subscribed to via realtime in the frontend, but the realtime publication may not be enabled for these tables.

**Fix:** Add migration to enable realtime for `trips` and `bookings`.

### 12. Edge Function `verify-payment` - Booking Not Found Check
If the booking was already confirmed, it attempts to confirm it again. No idempotency check.

**Fix:** Add check for existing confirmed status.

### 13. Admin Announcements - Missing Type Safety
The `announcements` insert uses `as any` cast which can cause type issues.

**Fix:** Use proper typing.

---

## Implementation Steps

### Step 1: Database Migration
Create a SQL migration to:
- Add `decrement_available_seats` RPC function (atomic seat decrement)
- Set default `share_link_id` on trips table using `gen_random_uuid()`
- Update existing trips without `share_link_id`
- Enable realtime for `trips` and `bookings` tables

### Step 2: Fix App.css Layout Breakage
Clear the default Vite `App.css` to remove:
- `max-width: 1280px` constraint
- `padding: 2rem`
- `text-align: center`
- `.card` padding override

### Step 3: Fix Trips.tsx Book Now Button
Ensure the `<Button asChild><Link>` pattern works reliably by verifying no CSS conflicts remain. Add fallback navigation handler.

### Step 4: Fix BookTrip.tsx Auth Flow
Keep the existing auth redirect logic but ensure it doesn't fire during SSR. Improve the loading state sequence.

### Step 5: Fix Payment.tsx Render Redirect
Move the confirmed booking redirect into a `useEffect` to prevent React rendering side effects.

### Step 6: Fix SeatSelector Deselection
Change the `handleSeatClick` to pass `null` when deselecting a seat.

### Step 7: Fix Route Consolidation
- Remove duplicate `/bookings` route
- Add `ProtectedRoute` wrappers to pages that need auth:
  - `/my-bookings`
  - `/profile`
  - `/apply-organizer`
  - `/submit-claim`
- Keep `/book/:tripId` and `/payment/:bookingId` with their own auth handling since they need redirect URLs

### Step 8: Fix Organizer Dashboard Create Trip
Change the "Create Trip" button to navigate to `/organizer/trips` instead of a non-existent `/organizer/trips/new`.

### Step 9: Fix Share Link Generation
Set `share_link_id` default in the trips table so every new trip gets one automatically. Update the `ShareTripLink` component to always show for approved trips.

### Step 10: Fix Edge Functions
- **verify-payment:** Add idempotency check for already-confirmed bookings
- **verify-payment:** Fix the `decrement_available_seats` call to use the newly created RPC
- **paystack-webhook:** Ensure it also uses the RPC for seat decrement

### Step 11: Fix Announcements Type Safety
Replace `as any` casts with proper typed inserts.

### Step 12: Fix MyBookings Auth Guard
Add proper auth loading guard to prevent flicker.

---

## Technical Details

### Database Migration SQL

```text
-- Create decrement_available_seats function
CREATE OR REPLACE FUNCTION public.decrement_available_seats(trip_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.trips
  SET available_seats = GREATEST(available_seats - 1, 0)
  WHERE id = trip_id_param AND available_seats > 0;
END;
$$;

-- Set default share_link_id on trips
ALTER TABLE public.trips
ALTER COLUMN share_link_id SET DEFAULT gen_random_uuid()::text;

-- Update existing trips without share_link_id
UPDATE public.trips SET share_link_id = gen_random_uuid()::text
WHERE share_link_id IS NULL;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
```

### Files to Modify

| File | Change |
|---|---|
| `src/App.css` | Clear all default Vite styles |
| `src/App.tsx` | Add ProtectedRoute wrappers, remove duplicate /bookings route |
| `src/pages/Trips.tsx` | Ensure Book Now link works reliably |
| `src/pages/Payment.tsx` | Move confirmed redirect to useEffect |
| `src/pages/BookingConfirmation.tsx` | Minor cleanup |
| `src/components/booking/SeatSelector.tsx` | Fix deselection logic |
| `src/pages/organizer/OrganizerDashboard.tsx` | Fix Create Trip button route |
| `src/pages/organizer/OrganizerTrips.tsx` | Ensure share link shows |
| `src/pages/admin/Announcements.tsx` | Fix type safety |
| `supabase/functions/verify-payment/index.ts` | Add idempotency, use RPC |
| `supabase/functions/paystack-webhook/index.ts` | Use RPC for seat decrement |

### Regarding Migration to Main Account

This project already runs on Lovable Cloud, which provides all backend capabilities. The database, authentication, and backend functions are all managed through this integrated system. There is no need for a separate migration -- everything is already connected and operational within Lovable Cloud.
