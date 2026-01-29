-- Add UPDATE policy for responsibility_matches table
CREATE POLICY "Users can update their own responsibility matches" 
ON public.responsibility_matches 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update profiles RLS policies to explicitly require authentication
-- Drop existing policies and recreate with auth.uid() IS NOT NULL check

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Recreate with explicit authentication check
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);