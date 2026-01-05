-- Drop the restrictive policy and create a permissive one for public slot viewing
DROP POLICY IF EXISTS "Anyone can view slots" ON public.slots;

-- Create a permissive SELECT policy for slots (allows anonymous and authenticated users)
CREATE POLICY "Anyone can view slots" 
ON public.slots 
FOR SELECT 
TO public
USING (true);