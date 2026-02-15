-- Admin permissions for limited admins
CREATE TABLE IF NOT EXISTS public.admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, section)
);

ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permissions
CREATE POLICY "Users can view their own admin permissions"
ON public.admin_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage permissions for any user
CREATE POLICY "Admins can manage admin permissions"
ON public.admin_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS admin_permissions_user_id_idx ON public.admin_permissions(user_id);
