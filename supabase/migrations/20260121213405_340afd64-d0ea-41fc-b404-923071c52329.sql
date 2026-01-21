-- Add recap_period column to user_preferences table
-- Allows users to choose between 'weekly' or 'monthly' recap view
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS recap_period text NOT NULL DEFAULT 'monthly';