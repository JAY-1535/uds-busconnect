-- ===========================================
-- 1. Make first user admin automatically
-- ===========================================

-- Update the handle_new_user function to make first user admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_count INT;
BEGIN
    -- Create profile
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    -- Check if this is the first user
    SELECT COUNT(*) INTO user_count FROM public.user_roles;
    
    IF user_count = 0 THEN
        -- First user becomes admin
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin');
    ELSE
        -- Default role is student
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'student');
    END IF;
    
    RETURN NEW;
END;
$function$;

-- ===========================================
-- 2. Create organizer_applications table
-- ===========================================

CREATE TABLE IF NOT EXISTS public.organizer_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    campus VARCHAR(20) NOT NULL CHECK (campus IN ('nyankpala', 'tamale')),
    bus_group_name TEXT NOT NULL,
    experience TEXT,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizer_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizer_applications
CREATE POLICY "Users can create their own applications"
ON public.organizer_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications"
ON public.organizer_applications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all applications"
ON public.organizer_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_organizer_applications_updated_at
BEFORE UPDATE ON public.organizer_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- 3. Function to approve organizer application
-- ===========================================

CREATE OR REPLACE FUNCTION public.approve_organizer_application(application_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    app_record RECORD;
BEGIN
    -- Get application
    SELECT * INTO app_record FROM public.organizer_applications WHERE id = application_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update application status
    UPDATE public.organizer_applications
    SET status = 'approved', 
        reviewed_by = auth.uid(),
        review_notes = admin_notes,
        updated_at = now()
    WHERE id = application_id;
    
    -- Add organizer role to user
    INSERT INTO public.user_roles (user_id, role, campus)
    VALUES (app_record.user_id, 'organizer', app_record.campus::campus_type)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$function$;

-- ===========================================
-- 4. Add foreign key constraint fix for bookings
-- ===========================================

-- Add foreign key for bookings.trip_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'bookings_trip_id_fkey'
    ) THEN
        ALTER TABLE public.bookings 
        ADD CONSTRAINT bookings_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for announcements.target_trip_id if not exists  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'announcements_target_trip_id_fkey'
    ) THEN
        ALTER TABLE public.announcements 
        ADD CONSTRAINT announcements_target_trip_id_fkey 
        FOREIGN KEY (target_trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;
    END IF;
END $$;