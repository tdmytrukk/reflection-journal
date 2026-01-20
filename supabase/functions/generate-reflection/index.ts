import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EntryData {
  achievements: string[];
  learnings: string[];
  insights: string[];
  decisions: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entryId, entryData }: { entryId: string; entryData: EntryData } = await req.json();

    if (!entryId || !entryData) {
      return new Response(JSON.stringify({ error: "Missing entryId or entryData" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the content to analyze
    const allContent = [
      ...entryData.achievements.map(a => `Achievement: ${a}`),
      ...entryData.learnings.map(l => `Learning: ${l}`),
      ...entryData.insights.map(i => `Insight: ${i}`),
      ...entryData.decisions.map(d => `Decision: ${d}`),
    ].join("\n");

    if (!allContent.trim()) {
      return new Response(JSON.stringify({ error: "No content to analyze" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI Gateway to generate reflection
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional career coach analyzing daily work journal entries. 
Your task is to provide a brief, encouraging reflection that highlights:
1. Key strengths demonstrated (2-3 traits like initiative, communication, problem-solving)
2. Notable achievements or wins
3. Growth areas or learning opportunities

Keep your response concise (3-4 sentences max). Be warm but professional.
Format your response as JSON with this structure:
{
  "summary": "A brief 1-2 sentence summary of the day",
  "strengths": ["strength1", "strength2"],
  "highlights": ["key highlight 1", "key highlight 2"],
  "encouragement": "A short encouraging closing statement"
}`
          },
          {
            role: "user",
            content: `Please analyze this journal entry and provide a reflection:\n\n${allContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate reflection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const reflectionText = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON response from AI
    let reflection;
    try {
      // Extract JSON from the response (in case it's wrapped in markdown code blocks)
      const jsonMatch = reflectionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reflection = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      // Fallback if AI doesn't return proper JSON
      reflection = {
        summary: reflectionText.slice(0, 200),
        strengths: [],
        highlights: [],
        encouragement: "Keep up the great work!",
      };
    }

    // Save reflection to the entry
    const { error: updateError } = await supabaseClient
      .from("entries")
      .update({ ai_reflection: reflection })
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Database update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save reflection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, reflection }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
