-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'department_head');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS policy: admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  year TEXT NOT NULL CHECK (year IN ('2nd', '3rd')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (name, year)
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Everyone can view departments
CREATE POLICY "Anyone can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage departments
CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create slots table
CREATE TABLE public.slots (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number IN (1, 2, 3)),
  time_range TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 7,
  filled INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on slots
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- Everyone can view slots
CREATE POLICY "Anyone can view slots"
ON public.slots
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage slots
CREATE POLICY "Admins can manage slots"
ON public.slots
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL,
  slot1_id TEXT REFERENCES public.slots(id) NOT NULL,
  slot2_id TEXT REFERENCES public.slots(id) NOT NULL,
  slot3_id TEXT REFERENCES public.slots(id) NOT NULL,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_locked BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (department_id)
);

-- Enable RLS on submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view submissions
CREATE POLICY "Authenticated can view submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can insert submissions
CREATE POLICY "Authenticated can insert submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can manage all submissions
CREATE POLICY "Admins can manage submissions"
ON public.submissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create system_settings table for admin controls
CREATE TABLE public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  is_system_locked BOOLEAN NOT NULL DEFAULT false,
  lock_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view system settings
CREATE POLICY "Anyone can view system settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- Admins can update system settings
CREATE POLICY "Admins can update system settings"
ON public.system_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default system settings
INSERT INTO public.system_settings (id, is_system_locked) VALUES ('main', false);

-- Create function to update slot filled count
CREATE OR REPLACE FUNCTION public.update_slot_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = NEW.slot1_id;
    UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = NEW.slot2_id;
    UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = NEW.slot3_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE slots SET filled = filled - 1, updated_at = now() WHERE id = OLD.slot1_id;
    UPDATE slots SET filled = filled - 1, updated_at = now() WHERE id = OLD.slot2_id;
    UPDATE slots SET filled = filled - 1, updated_at = now() WHERE id = OLD.slot3_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for slot count updates
CREATE TRIGGER update_slot_filled_count
AFTER INSERT OR DELETE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.update_slot_count();

-- Function to clear all submissions (admin only)
CREATE OR REPLACE FUNCTION public.clear_all_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  DELETE FROM public.submissions;
  UPDATE public.slots SET filled = 0, updated_at = now();
END;
$$;

-- Function to reset all slots
CREATE OR REPLACE FUNCTION public.reset_all_slots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  UPDATE public.slots SET filled = 0, updated_at = now();
END;
$$;