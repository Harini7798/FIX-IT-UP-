-- Update RLS policy to only allow fixers to create repair requests
DROP POLICY IF EXISTS "Fixers can create repair requests" ON public.repair_requests;

CREATE POLICY "Only fixers can create repair requests" 
ON public.repair_requests 
FOR INSERT 
WITH CHECK (
  auth.uid() = fixer_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('fixer', 'both')
  )
);