-- Table for storing responsibility matches between entries and job responsibilities
CREATE TABLE public.responsibility_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  responsibility_index INTEGER NOT NULL, -- index in the responsibilities array
  responsibility_text TEXT NOT NULL,
  match_score DECIMAL(3,2) NOT NULL DEFAULT 0.00, -- 0.00 to 1.00
  evidence_type TEXT NOT NULL DEFAULT 'weak', -- 'strong', 'moderate', 'weak'
  matched_items JSONB DEFAULT '[]', -- array of {category, text} that matched
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for quarterly check-ins
CREATE TABLE public.quarterly_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quarter INTEGER NOT NULL, -- 1, 2, 3, 4
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  flagged_responsibilities JSONB DEFAULT '[]', -- array of {index, text, coverage, action, note}
  focus_next_quarter JSONB DEFAULT '[]', -- array of responsibility texts for soft nudges
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quarter, year)
);

-- Add new preference columns
ALTER TABLE public.user_preferences 
ADD COLUMN quarterly_checkin_enabled BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN monthly_pulse_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN email_reminders_enabled BOOLEAN NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE public.responsibility_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies for responsibility_matches
CREATE POLICY "Users can view their own responsibility matches" 
ON public.responsibility_matches FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own responsibility matches" 
ON public.responsibility_matches FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responsibility matches" 
ON public.responsibility_matches FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for quarterly_checkins
CREATE POLICY "Users can view their own quarterly checkins" 
ON public.quarterly_checkins FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quarterly checkins" 
ON public.quarterly_checkins FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quarterly checkins" 
ON public.quarterly_checkins FOR UPDATE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_quarterly_checkins_updated_at
BEFORE UPDATE ON public.quarterly_checkins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();