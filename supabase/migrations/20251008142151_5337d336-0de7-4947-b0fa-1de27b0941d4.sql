-- Drop existing policies if they exist
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
DROP POLICY IF EXISTS "Only system can manage user roles" ON public.user_roles;

-- Create user_role enum (if not exists)
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('requester', 'fixer', 'both');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Only system can manage user roles"
  ON public.user_roles
  FOR ALL
  USING (false);

-- Create or replace security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
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

-- Update RLS policy on repair_requests to use has_role function
DROP POLICY IF EXISTS "Only fixers can create repair requests" ON public.repair_requests;

CREATE POLICY "Only fixers can create repair requests"
  ON public.repair_requests
  FOR INSERT
  WITH CHECK (
    auth.uid() = fixer_id 
    AND (
      public.has_role(auth.uid(), 'fixer'::user_role) 
      OR public.has_role(auth.uid(), 'both'::user_role)
    )
  );