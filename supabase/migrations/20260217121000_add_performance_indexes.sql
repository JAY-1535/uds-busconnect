-- Performance indexes for common read paths used by dashboards and auth bootstrapping.
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS bus_groups_organizer_id_idx ON public.bus_groups (organizer_id);
CREATE INDEX IF NOT EXISTS trips_bus_group_id_idx ON public.trips (bus_group_id);
CREATE INDEX IF NOT EXISTS trips_status_departure_date_idx ON public.trips (status, departure_date);
CREATE INDEX IF NOT EXISTS bookings_user_id_created_at_idx ON public.bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_trip_id_status_idx ON public.bookings (trip_id, status);
CREATE INDEX IF NOT EXISTS organizer_applications_user_id_status_idx ON public.organizer_applications (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS payments_paystack_reference_idx ON public.payments (paystack_reference);

