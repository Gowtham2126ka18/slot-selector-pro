-- Create a junction table for department head to multiple departments relationship
CREATE TABLE public.department_head_departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id uuid NOT NULL REFERENCES public.department_head_credentials(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(credential_id, department_id)
);

-- Enable RLS
ALTER TABLE public.department_head_departments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage department_head_departments"
ON public.department_head_departments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Department heads can view own department assignments"
ON public.department_head_departments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM department_head_credentials dhc
    WHERE dhc.id = credential_id AND dhc.user_id = auth.uid()
  )
);

-- Update submit_slot_selection function to check the new table
CREATE OR REPLACE FUNCTION public.submit_slot_selection(p_department_id uuid, p_section_id uuid, p_slot1_id text, p_slot2_id text, p_slot3_id text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_is_locked BOOLEAN;
  v_slot1_filled INTEGER;
  v_slot2_filled INTEGER;
  v_slot3_filled INTEGER;
  v_slot1_capacity INTEGER;
  v_slot2_capacity INTEGER;
  v_slot3_capacity INTEGER;
  v_submission_id UUID;
  v_slot1_day TEXT;
  v_slot1_number INTEGER;
  v_slot2_day TEXT;
  v_slot2_number INTEGER;
  v_slot3_day TEXT;
  v_slot3_number INTEGER;
  v_rule_exists BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user is department head for this department (check both old and new tables)
  IF NOT EXISTS (
    SELECT 1 FROM department_head_credentials dhc
    WHERE dhc.user_id = v_user_id 
    AND dhc.is_enabled = true
    AND (
      dhc.department_id = p_department_id
      OR EXISTS (
        SELECT 1 FROM department_head_departments dhd
        WHERE dhd.credential_id = dhc.id AND dhd.department_id = p_department_id
      )
    )
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Not a department head for this department');
  END IF;

  -- Check system lock status
  SELECT is_system_locked INTO v_is_locked FROM system_settings WHERE id = 'main';
  IF v_is_locked THEN
    RETURN json_build_object('success', false, 'error', 'System is locked for submissions');
  END IF;

  -- Check if section already has a submission
  IF EXISTS (
    SELECT 1 FROM submissions 
    WHERE section_id = p_section_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'This section has already submitted');
  END IF;

  -- Validate section belongs to department
  IF NOT EXISTS (
    SELECT 1 FROM sections 
    WHERE id = p_section_id 
    AND department_id = p_department_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid section for this department');
  END IF;

  -- Parse slot IDs to get day and number
  SELECT day, slot_number INTO v_slot1_day, v_slot1_number FROM slots WHERE id = p_slot1_id;
  SELECT day, slot_number INTO v_slot2_day, v_slot2_number FROM slots WHERE id = p_slot2_id;
  SELECT day, slot_number INTO v_slot3_day, v_slot3_number FROM slots WHERE id = p_slot3_id;

  -- Validate slots exist
  IF v_slot1_day IS NULL OR v_slot2_day IS NULL OR v_slot3_day IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'One or more slots do not exist');
  END IF;

  -- Check slot dependency rules
  SELECT EXISTS (
    SELECT 1 FROM slot_dependency_rules
    WHERE slot1_day = v_slot1_day
    AND slot1_number = v_slot1_number
    AND slot2_day = v_slot2_day
    AND slot2_number = v_slot2_number
    AND slot3_day = v_slot3_day
    AND slot3_number = v_slot3_number
  ) INTO v_rule_exists;

  IF NOT v_rule_exists THEN
    RETURN json_build_object('success', false, 'error', 'Invalid slot combination according to dependency rules');
  END IF;

  -- Lock rows and check capacity atomically
  SELECT filled, capacity INTO v_slot1_filled, v_slot1_capacity 
  FROM slots WHERE id = p_slot1_id FOR UPDATE;
  
  SELECT filled, capacity INTO v_slot2_filled, v_slot2_capacity 
  FROM slots WHERE id = p_slot2_id FOR UPDATE;
  
  SELECT filled, capacity INTO v_slot3_filled, v_slot3_capacity 
  FROM slots WHERE id = p_slot3_id FOR UPDATE;

  -- Check capacity
  IF v_slot1_filled >= v_slot1_capacity THEN
    RETURN json_build_object('success', false, 'error', 'Slot 1 is at full capacity');
  END IF;
  
  IF v_slot2_filled >= v_slot2_capacity THEN
    RETURN json_build_object('success', false, 'error', 'Slot 2 is at full capacity');
  END IF;
  
  IF v_slot3_filled >= v_slot3_capacity THEN
    RETURN json_build_object('success', false, 'error', 'Slot 3 is at full capacity');
  END IF;

  -- Insert submission
  INSERT INTO submissions (department_id, section_id, slot1_id, slot2_id, slot3_id, submitted_by)
  VALUES (p_department_id, p_section_id, p_slot1_id, p_slot2_id, p_slot3_id, v_user_id)
  RETURNING id INTO v_submission_id;

  -- Update slot counts
  UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = p_slot1_id;
  UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = p_slot2_id;
  UPDATE slots SET filled = filled + 1, updated_at = now() WHERE id = p_slot3_id;

  RETURN json_build_object('success', true, 'submission_id', v_submission_id);
END;
$function$;