-- Create enum types
CREATE TYPE public.app_role AS ENUM ('student', 'organizer', 'admin');
CREATE TYPE public.campus_type AS ENUM ('nyankpala', 'tamale');
CREATE TYPE public.trip_status AS ENUM ('pending', 'approved', 'denied', 'cancelled', 'completed');
CREATE TYPE public.booking_status AS ENUM ('provisional', 'confirmed', 'cancelled');
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- Profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    campus campus_type,
    student_id TEXT,
    student_class TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    campus campus_type,
    UNIQUE (user_id, role)
);

-- Bus groups (organizer companies/groups)
CREATE TABLE public.bus_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    campus campus_type NOT NULL,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    whatsapp_group_link TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buses belonging to bus groups
CREATE TABLE public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_group_id UUID REFERENCES public.bus_groups(id) ON DELETE CASCADE NOT NULL,
    bus_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trips
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_group_id UUID REFERENCES public.bus_groups(id) ON DELETE CASCADE NOT NULL,
    bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    person_in_charge TEXT NOT NULL,
    person_in_charge_contact TEXT NOT NULL,
    status trip_status NOT NULL DEFAULT 'pending',
    share_link_id TEXT UNIQUE DEFAULT gen_random_uuid()::text,
    campus campus_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bookings
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    student_id TEXT NOT NULL,
    student_class TEXT NOT NULL,
    phone TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    seat_number INTEGER NOT NULL,
    has_luggage BOOLEAN DEFAULT false,
    luggage_count INTEGER DEFAULT 0,
    luggage_tagging_fee DECIMAL(10,2) DEFAULT 0,
    travel_safe_fee DECIMAL(10,2) DEFAULT 30.00,
    total_amount DECIMAL(10,2) NOT NULL,
    status booking_status NOT NULL DEFAULT 'provisional',
    luggage_id TEXT,
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (trip_id, seat_number)
);

-- Payments
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT DEFAULT 'mobile_money',
    payment_reference TEXT,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Damage claims
CREATE TABLE public.damage_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    amount_claimed DECIMAL(10,2),
    amount_approved DECIMAL(10,2),
    status claim_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- UDS BusConnect Representatives
CREATE TABLE public.representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    campus campus_type NOT NULL,
    station_assignment TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'students', 'organizers', 'trip_customers'
    target_trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    campus campus_type,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Function to get user campus
CREATE OR REPLACE FUNCTION public.get_user_campus(_user_id UUID)
RETURNS campus_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT campus
    FROM public.profiles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Bus groups policies
CREATE POLICY "Anyone can view active bus groups"
ON public.bus_groups FOR SELECT
USING (is_active = true);

CREATE POLICY "Organizers can manage their bus groups"
ON public.bus_groups FOR ALL
USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all bus groups"
ON public.bus_groups FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Buses policies
CREATE POLICY "Anyone can view buses"
ON public.buses FOR SELECT
USING (true);

CREATE POLICY "Organizers can manage their buses"
ON public.buses FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.bus_groups
    WHERE bus_groups.id = buses.bus_group_id
    AND bus_groups.organizer_id = auth.uid()
));

CREATE POLICY "Admins can manage all buses"
ON public.buses FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trips policies
CREATE POLICY "Anyone can view approved trips"
ON public.trips FOR SELECT
USING (status = 'approved');

CREATE POLICY "Organizers can view their trips"
ON public.trips FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.bus_groups
    WHERE bus_groups.id = trips.bus_group_id
    AND bus_groups.organizer_id = auth.uid()
));

CREATE POLICY "Organizers can create trips"
ON public.trips FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.bus_groups
    WHERE bus_groups.id = bus_group_id
    AND bus_groups.organizer_id = auth.uid()
));

CREATE POLICY "Organizers can update their trips"
ON public.trips FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.bus_groups
    WHERE bus_groups.id = trips.bus_group_id
    AND bus_groups.organizer_id = auth.uid()
));

CREATE POLICY "Admins can manage all trips"
ON public.trips FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organizers can view bookings for their trips"
ON public.bookings FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.trips
    JOIN public.bus_groups ON trips.bus_group_id = bus_groups.id
    WHERE trips.id = bookings.trip_id
    AND bus_groups.organizer_id = auth.uid()
));

CREATE POLICY "Admins can manage all bookings"
ON public.bookings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Payments policies
CREATE POLICY "Users can view their own payments"
ON public.payments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = payments.booking_id
    AND bookings.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Damage claims policies
CREATE POLICY "Users can view their own claims"
ON public.damage_claims FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
ON public.damage_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all claims"
ON public.damage_claims FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Representatives policies
CREATE POLICY "Admins can manage representatives"
ON public.representatives FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view representatives"
ON public.representatives FOR SELECT
USING (true);

-- Announcements policies
CREATE POLICY "Anyone can view announcements"
ON public.announcements FOR SELECT
USING (true);

CREATE POLICY "Organizers can create announcements"
ON public.announcements FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'organizer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all announcements"
ON public.announcements FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bus_groups_updated_at
    BEFORE UPDATE ON public.bus_groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_damage_claims_updated_at
    BEFORE UPDATE ON public.damage_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate luggage ID
CREATE OR REPLACE FUNCTION public.generate_luggage_id(organizer_name TEXT, seat_num INTEGER, stu_id TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT UPPER(RIGHT(organizer_name, 3)) || seat_num::TEXT || stu_id
$$;

-- Enable realtime for bookings and trips
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
    );
    
    -- Default role is student
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();