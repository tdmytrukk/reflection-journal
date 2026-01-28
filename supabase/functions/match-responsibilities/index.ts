import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MatchResult {
  responsibilityIndex: number;
  responsibilityText: string;
  matchScore: number;
  evidenceType: 'strong' | 'moderate' | 'weak' | 'none';
  matchedItems: { category: string; text: string }[];
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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

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

    const { entryId } = await req.json();
    const userId = user.id; // Use authenticated user's ID, not from request body
    
    if (!entryId) {
      return new Response(
        JSON.stringify({ error: "entryId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Use service role for database operations after auth is verified
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the entry
    const { data: entry, error: entryError } = await supabase
      .from("entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", userId)
      .single();

    if (entryError || !entry) {
      return new Response(
        JSON.stringify({ error: "Entry not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    
    // Combine all entry items for matching
    const entryItems = [
      ...(entry.achievements || []).map((t: string) => ({ category: 'achievement', text: t })),
      ...(entry.learnings || []).map((t: string) => ({ category: 'learning', text: t })),
      ...(entry.insights || []).map((t: string) => ({ category: 'insight', text: t })),
      ...(entry.decisions || []).map((t: string) => ({ category: 'decision', text: t })),
    ];

    if (entryItems.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to match entry items to responsibilities
    const prompt = `You are analyzing work diary entries to match them against job responsibilities.

Job Responsibilities:
${responsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Diary Entry Items:
${entryItems.map((item, i) => `${i + 1}. [${item.category}] ${item.text}`).join('\n')}

For each responsibility, analyze which diary items provide evidence of work in that area. Return a JSON array where each object contains:
- responsibilityIndex: the 0-based index of the responsibility
- matchedItemIndices: array of 0-based indices of matching diary items
- score: a number from 0 to 1 indicating match strength (0 = no match, 1 = strong direct evidence)

Only include responsibilities that have at least one matching item (score > 0.2).
Be thoughtful and precise - only match when there's genuine relevance, not superficial keyword overlap.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a precise work diary analyzer. Return only valid JSON arrays." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_matches",
              description: "Report matches between diary items and responsibilities",
              parameters: {
                type: "object",
                properties: {
                  matches: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        responsibilityIndex: { type: "number" },
                        matchedItemIndices: { type: "array", items: { type: "number" } },
                        score: { type: "number" }
                      },
                      required: ["responsibilityIndex", "matchedItemIndices", "score"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["matches"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "report_matches" } }
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", await aiResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to analyze matches" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiMatches = JSON.parse(toolCall.function.arguments);
    
    // Process matches and store in database
    const results: MatchResult[] = [];
    
    // Delete existing matches for this entry
    await supabase
      .from("responsibility_matches")
      .delete()
      .eq("entry_id", entryId);

    for (const match of aiMatches.matches) {
      if (match.score < 0.2) continue;
      
      const evidenceType = match.score >= 0.7 ? 'strong' : match.score >= 0.4 ? 'moderate' : 'weak';
      const matchedItems = match.matchedItemIndices.map((i: number) => entryItems[i]).filter(Boolean);
      
      const result: MatchResult = {
        responsibilityIndex: match.responsibilityIndex,
        responsibilityText: responsibilities[match.responsibilityIndex],
        matchScore: match.score,
        evidenceType,
        matchedItems,
      };
      
      results.push(result);

      // Store in database
      await supabase
        .from("responsibility_matches")
        .insert({
          user_id: userId,
          entry_id: entryId,
          responsibility_index: match.responsibilityIndex,
          responsibility_text: responsibilities[match.responsibilityIndex],
          match_score: match.score,
          evidence_type: evidenceType,
          matched_items: matchedItems,
        });
    }

    return new Response(
      JSON.stringify({ matches: results }),
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