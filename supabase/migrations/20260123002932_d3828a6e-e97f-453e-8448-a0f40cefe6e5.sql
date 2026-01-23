-- Add work_artifacts column to entries table for storing links to work examples
ALTER TABLE public.entries 
ADD COLUMN work_artifacts jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.entries.work_artifacts IS 'Array of work artifact links: [{url: string, label: string, type: "video" | "article" | "document" | "other"}]';