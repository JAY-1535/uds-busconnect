-- Harden organizer approval RPC so only admins can approve applications.
CREATE OR REPLACE FUNCTION public.approve_organizer_application(application_id UUID, admin_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    app_record RECORD;
BEGIN
    IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Only admins can approve organizer applications';
    END IF;

    SELECT * INTO app_record
    FROM public.organizer_applications
    WHERE id = application_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    UPDATE public.organizer_applications
    SET status = 'approved',
        reviewed_by = auth.uid(),
        review_notes = admin_notes,
        updated_at = now()
    WHERE id = application_id;

    INSERT INTO public.user_roles (user_id, role, campus)
    VALUES (app_record.user_id, 'organizer', app_record.campus::campus_type)
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN TRUE;
END;
$function$;

