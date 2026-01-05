-- Remove the unrestricted INSERT policy that allows any authenticated user to create submissions
DROP POLICY IF EXISTS "Authenticated can insert submissions" ON public.submissions;