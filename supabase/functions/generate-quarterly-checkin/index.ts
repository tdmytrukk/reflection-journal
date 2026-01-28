import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlaggedResponsibility {
  index: number;
  text: string;
  coverage: 'none' | 'weak';
  matchCount: number;
  averageScore: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { quarter, year } = await req.json();
    const userId = user.id; // Use authenticated user's ID, not from request body
    
    if (!quarter || !year) {
      return new Response(
        JSON.stringify({ error: "quarter and year are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role for database operations after auth is verified
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get quarter date range
    const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    const quarterStart = new Date(year, startMonth, 1);
    const quarterEnd = new Date(year, startMonth + 3, 0); // Last day of quarter

    // Fetch current job description
    const { data: job, error: jobError } = await supabase
      .from("job_descriptions")
      .select("*")
      .eq("user_id", userId)
      .is("end_date", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobError || !job || !job.responsibilities || job.responsibilities.length === 0) {
      return new Response(
        JSON.stringify({ error: "No job description with responsibilities found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responsibilities: string[] = job.responsibilities;

    // Get all entries for the quarter
    const { data: entries } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", userId)
      .gte("date", quarterStart.toISOString().split('T')[0])
      .lte("date", quarterEnd.toISOString().split('T')[0]);

    const entryIds = entries?.map(e => e.id) || [];

    // Get all responsibility matches for the quarter
    const { data: matches } = await supabase
      .from("responsibility_matches")
      .select("*")
      .eq("user_id", userId)
      .in("entry_id", entryIds.length > 0 ? entryIds : ['no-entries']);

    // Aggregate matches by responsibility
    const responsibilityCoverage = responsibilities.map((text, index) => {
      const respMatches = matches?.filter(m => m.responsibility_index === index) || [];
      const totalScore = respMatches.reduce((sum, m) => sum + parseFloat(m.match_score), 0);
      const avgScore = respMatches.length > 0 ? totalScore / respMatches.length : 0;
      
      return {
        index,
        text,
        matchCount: respMatches.length,
        averageScore: avgScore,
        coverage: respMatches.length === 0 ? 'none' : avgScore < 0.4 ? 'weak' : 'covered'
      };
    });

    // Find responsibilities with no or weak evidence
    const flagged: FlaggedResponsibility[] = responsibilityCoverage
      .filter(r => r.coverage === 'none' || r.coverage === 'weak')
      .sort((a, b) => a.averageScore - b.averageScore) // Sort by worst coverage first
      .slice(0, 5) // Limit to top 5
      .map(r => ({
        index: r.index,
        text: r.text,
        coverage: r.coverage as 'none' | 'weak',
        matchCount: r.matchCount,
        averageScore: r.averageScore,
      }));

    // Check if check-in already exists
    const { data: existing } = await supabase
      .from("quarterly_checkins")
      .select("*")
      .eq("user_id", userId)
      .eq("quarter", quarter)
      .eq("year", year)
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase
        .from("quarterly_checkins")
        .update({
          flagged_responsibilities: flagged,
          status: existing.status === 'completed' ? 'completed' : 'pending',
        })
        .eq("id", existing.id);
    } else {
      // Create new
      await supabase
        .from("quarterly_checkins")
        .insert({
          user_id: userId,
          quarter,
          year,
          flagged_responsibilities: flagged,
          status: 'pending',
        });
    }

    return new Response(
      JSON.stringify({ 
        flaggedCount: flagged.length,
        flaggedResponsibilities: flagged,
        totalResponsibilities: responsibilities.length,
        entriesInQuarter: entryIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});