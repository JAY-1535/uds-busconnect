
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
