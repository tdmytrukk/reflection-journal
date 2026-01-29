-- Fix RLS policies for all tables to prevent unauthenticated access
-- The issue is that existing policies use auth.uid() = user_id which returns NULL for anonymous users
-- We need to ensure auth.uid() IS NOT NULL in all policies

-- ENTRIES TABLE
DROP POLICY IF EXISTS "Users can view their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can create their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON public.entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON public.entries;

CREATE POLICY "Users can view their own entries" 
ON public.entries FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own entries" 
ON public.entries FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON public.entries FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries" 
ON public.entries FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- GOALS TABLE
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

CREATE POLICY "Users can view their own goals" 
ON public.goals FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- JOB_DESCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own job descriptions" ON public.job_descriptions;
DROP POLICY IF EXISTS "Users can create their own job descriptions" ON public.job_descriptions;
DROP POLICY IF EXISTS "Users can update their own job descriptions" ON public.job_descriptions;
DROP POLICY IF EXISTS "Users can delete their own job descriptions" ON public.job_descriptions;

CREATE POLICY "Users can view their own job descriptions" 
ON public.job_descriptions FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own job descriptions" 
ON public.job_descriptions FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own job descriptions" 
ON public.job_descriptions FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own job descriptions" 
ON public.job_descriptions FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- QUARTERLY_CHECKINS TABLE
DROP POLICY IF EXISTS "Users can view their own quarterly checkins" ON public.quarterly_checkins;
DROP POLICY IF EXISTS "Users can create their own quarterly checkins" ON public.quarterly_checkins;
DROP POLICY IF EXISTS "Users can update their own quarterly checkins" ON public.quarterly_checkins;
DROP POLICY IF EXISTS "Users can delete their own quarterly checkins" ON public.quarterly_checkins;

CREATE POLICY "Users can view their own quarterly checkins" 
ON public.quarterly_checkins FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own quarterly checkins" 
ON public.quarterly_checkins FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own quarterly checkins" 
ON public.quarterly_checkins FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own quarterly checkins" 
ON public.quarterly_checkins FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- RESPONSIBILITY_MATCHES TABLE
DROP POLICY IF EXISTS "Users can view their own responsibility matches" ON public.responsibility_matches;
DROP POLICY IF EXISTS "Users can create their own responsibility matches" ON public.responsibility_matches;
DROP POLICY IF EXISTS "Users can update their own responsibility matches" ON public.responsibility_matches;
DROP POLICY IF EXISTS "Users can delete their own responsibility matches" ON public.responsibility_matches;

CREATE POLICY "Users can view their own responsibility matches" 
ON public.responsibility_matches FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own responsibility matches" 
ON public.responsibility_matches FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own responsibility matches" 
ON public.responsibility_matches FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own responsibility matches" 
ON public.responsibility_matches FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- USER_PREFERENCES TABLE
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);