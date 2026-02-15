-- Fix the generate_luggage_id function to include search_path
CREATE OR REPLACE FUNCTION public.generate_luggage_id(organizer_name TEXT, seat_num INTEGER, stu_id TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT UPPER(RIGHT(organizer_name, 3)) || seat_num::TEXT || stu_id
$$;