-- First create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add department_id to user_roles for department heads (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles' 
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create department_head_credentials table for managing department head logins
CREATE TABLE IF NOT EXISTS public.department_head_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on department_head_credentials
ALTER TABLE public.department_head_credentials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage department_head_credentials" ON public.department_head_credentials;
DROP POLICY IF EXISTS "Department heads can view own credentials" ON public.department_head_credentials;

-- Admins can manage department head credentials
CREATE POLICY "Admins can manage department_head_credentials"
ON public.department_head_credentials
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Department heads can view their own credentials
CREATE POLICY "Department heads can view own credentials"
ON public.department_head_credentials
FOR SELECT
USING (user_id = auth.uid());

-- Create audit_logs table for admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  INSERT INTO public.audit_logs (user_id, action, target_type, target_id, details)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function to check if department has submitted
CREATE OR REPLACE FUNCTION public.department_has_submitted(p_department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.submissions
    WHERE department_id = p_department_id
  )
$$;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Department heads can insert own submission" ON public.submissions;

-- Allow department heads to insert their own submissions (one time only)
CREATE POLICY "Department heads can insert own submission"
ON public.submissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.department_head_credentials dhc
    WHERE dhc.user_id = auth.uid()
    AND dhc.department_id = department_id
    AND dhc.is_enabled = true
    AND NOT public.department_has_submitted(department_id)
  )
);

-- Create trigger for updated_at (drop first if exists)
DROP TRIGGER IF EXISTS update_department_head_credentials_updated_at ON public.department_head_credentials;
CREATE TRIGGER update_department_head_credentials_updated_at
BEFORE UPDATE ON public.department_head_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();