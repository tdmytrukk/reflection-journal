import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EntryData {
  id: string;
  date: string;
  achievements: string[];
  learnings: string[];
  insights: string[];
  decisions: string[];
}

interface JobDescription {
  title: string;
  company: string;
  responsibilities: string[];
}

interface MonthlyReviewAchievement {
  text: string;
  isNew: boolean;
  impact: 'high' | 'medium' | 'standard';
}

interface MonthlyReviewOutput {
  summary: string;
  achievements: MonthlyReviewAchievement[];
  growth: string[];
  strengths: string[];
  stats: {
    daysActive: number;
    totalEntries: number;
    newAchievementTypes: number;
  };
}

function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // Last day of month
  return { start, end };
}

function formatEntriesForPrompt(entries: EntryData[]): string {
  return entries.map(e => {
    const parts = [];
    if (e.achievements?.length) parts.push(`Achievements: ${e.achievements.join('; ')}`);
    if (e.learnings?.length) parts.push(`Learnings: ${e.learnings.join('; ')}`);
    if (e.insights?.length) parts.push(`Insights: ${e.insights.join('; ')}`);
    if (e.decisions?.length) parts.push(`Decisions: ${e.decisions.join('; ')}`);
    return `Date: ${e.date}\n${parts.join('\n')}`;
  }).join('\n\n');
}

function extractHistoricalPatterns(entries: EntryData[]): string {
  const allAchievements = entries.flatMap(e => e.achievements || []);
  const allLearnings = entries.flatMap(e => e.learnings || []);
  
  // Extract keywords and patterns
  const keywords = new Set<string>();
  [...allAchievements, ...allLearnings].forEach(text => {
    const lower = text.toLowerCase();
    if (lower.includes('present')) keywords.add('presentations');
    if (lower.includes('lead') || lower.includes('led')) keywords.add('leadership');
    if (lower.includes('team')) keywords.add('team collaboration');
    if (lower.includes('client') || lower.includes('customer')) keywords.add('client work');
    if (lower.includes('launch') || lower.includes('ship')) keywords.add('product launches');
    if (lower.includes('design')) keywords.add('design work');
    if (lower.includes('code') || lower.includes('develop')) keywords.add('development');
    if (lower.includes('meeting') || lower.includes('stakeholder')) keywords.add('stakeholder management');
  });
  
  if (keywords.size === 0) {
    return 'No previous entries available for comparison.';
  }
  
  return `Previously demonstrated activities: ${Array.from(keywords).join(', ')}. Total entries in history: ${entries.length}.`;
}

Deno.serve(async (req) => {
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { month, year }: { month: number; year: number } = await req.json();

    if (!month || !year) {
      return new Response(JSON.stringify({ error: "month and year are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get month date range
    const { start, end } = getMonthRange(year, month);
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // Fetch entries for this month
    const { data: monthEntries, error: entriesError } = await supabaseClient
      .from("entries")
      .select("id, date, achievements, learnings, insights, decisions")
      .eq("user_id", user.id)
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true });

    if (entriesError) {
      console.error("Error fetching entries:", entriesError);
      return new Response(JSON.stringify({ error: "Failed to fetch entries" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entries = (monthEntries || []) as EntryData[];

    // Check minimum entries
    if (entries.length < 3) {
      return new Response(JSON.stringify({ 
        error: "Not enough entries",
        message: "Add a few more entries to generate your monthly review.",
        entriesCount: entries.length,
        required: 3
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch job description
    const { data: jobData } = await supabaseClient
      .from("job_descriptions")
      .select("title, company, responsibilities")
      .eq("user_id", user.id)
      .is("end_date", null)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const job: JobDescription | null = jobData;

    // Fetch historical entries (previous 3 months for comparison)
    const threeMonthsAgo = new Date(year, month - 4, 1);
    const { data: historicalEntries } = await supabaseClient
      .from("entries")
      .select("id, date, achievements, learnings, insights, decisions")
      .eq("user_id", user.id)
      .gte("date", threeMonthsAgo.toISOString().split('T')[0])
      .lt("date", startStr)
      .order("date", { ascending: false });

    const historicalSummary = extractHistoricalPatterns((historicalEntries || []) as EntryData[]);

    // Calculate stats
    const uniqueDays = new Set(entries.map(e => e.date)).size;
    const totalItems = entries.reduce((sum, e) => 
      sum + (e.achievements?.length || 0) + (e.learnings?.length || 0) + 
      (e.insights?.length || 0) + (e.decisions?.length || 0), 0
    );

    // Build the AI prompt
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const systemPrompt = `You are a supportive career coach reflecting on a professional's recent work. Your job is to write a brief, warm summary that feels like a personal note — not a performance review.

CONTEXT:
${job ? `- User's role: ${job.title} at ${job.company}
- Responsibilities: ${job.responsibilities?.join('; ') || 'Not specified'}` : '- Role information not available'}
- Historical patterns: ${historicalSummary}

YOUR VOICE & TONE:
- Warm, human, and encouraging
- Conversational and natural (avoid corporate or analytical language)
- Reflective rather than evaluative
- Confident but not hype-driven
- Write like you're speaking to a friend, not presenting to a board

WRITING STYLE RULES:
- Write in second person ("you")
- Use short, flowing paragraphs (2–3 sentences max each)
- Avoid buzzwords like "high-performing," "effective execution," "delivered results," "proactive"
- Avoid rigid metrics unless they add emotional meaning
- Do NOT mention dates, "this month," "this week," or "today"
- No bullet-point energy — keep it flowing and human

CONTENT FOCUS:
- Focus on momentum, focus, and decision-making — not just outcomes
- Highlight risk-taking, trust in self, and follow-through
- When possible, reflect patterns (e.g., acting without overthinking, staying in flow)
- Avoid repeating the same phrasing or achievements across reflections
- Notice the HOW, not just the WHAT (how they approached things, not just what got done)

EXAMPLE TONE TO MATCH:
"You were really in your flow. You stayed focused, used your time well, and got things moving without overcomplicating them.

You also took a bit of a leap by launching something new and high-stakes — and it delivered right away. It's a good reminder that you don't need everything to be perfect to get strong results."

WHAT TO AVOID:
- Generic praise ("great job," "excellent work," "keep it up")
- Performance review language ("demonstrated competency," "exceeded expectations")
- Mentioning specific dates or time periods
- Repeating the user's words verbatim
- Corporate jargon without substance
- Future-focused language or "next steps"

OUTPUT STRUCTURE:
1. Summary (2-3 short paragraphs): A coaching reflection the user would want to reread. Warm, specific, and insightful.

2. Achievements (3-5 items): Key moments worth remembering
   - Mark with isNew: true if this is NEW behavior (not seen in their history)
   - Mark impact: "high" for meaningful wins, "medium" for solid moves, "standard" for steady work

3. Growth (2-3 items): What they're building in themselves — skills, confidence, patterns

4. Strengths (3-5 tags): Natural abilities they showed — use human language, not resume language

LENGTH:
- Summary: 50-80 words total (not per paragraph)
- Each achievement: 10-20 words
- Total response: 150-250 words

OUTPUT FORMAT (strict JSON):
{
  "summary": "Your coaching reflection paragraphs here",
  "achievements": [
    { "text": "Achievement description", "isNew": boolean, "impact": "high" | "medium" | "standard" }
  ],
  "growth": ["Growth indicator 1", "Growth indicator 2"],
  "strengths": ["Human Strength 1", "Human Strength 2"]
}`;

    const userPrompt = `Reflect on these work entries and write a warm, coach-like summary:

${formatEntriesForPrompt(entries)}

Return as valid JSON matching the specified format.`;

    // Call Lovable AI Gateway
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
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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
      
      return new Response(JSON.stringify({ error: "Failed to generate review" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const responseText = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let reviewData: MonthlyReviewOutput;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize the response
        reviewData = {
          summary: parsed.summary || "",
          achievements: (parsed.achievements || []).map((a: { text?: string; isNew?: boolean; impact?: string }) => ({
            text: a.text || "",
            isNew: Boolean(a.isNew),
            impact: ['high', 'medium', 'standard'].includes(a.impact || '') ? a.impact : 'standard'
          })),
          growth: parsed.growth || [],
          strengths: parsed.strengths || [],
          stats: {
            daysActive: uniqueDays,
            totalEntries: entries.length,
            newAchievementTypes: (parsed.achievements || []).filter((a: { isNew?: boolean }) => a.isNew).length
          }
        };
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, responseText);
      // Return a fallback structure
      reviewData = {
        summary: "Your work this month showed consistent effort across multiple areas.",
        achievements: entries.slice(0, 3).flatMap(e => 
          (e.achievements || []).slice(0, 1).map(text => ({
            text,
            isNew: false,
            impact: 'standard' as const
          }))
        ),
        growth: ["Continued professional development"],
        strengths: ["Consistency", "Dedication"],
        stats: {
          daysActive: uniqueDays,
          totalEntries: entries.length,
          newAchievementTypes: 0
        }
      };
    }

    return new Response(JSON.stringify({ 
      success: true, 
      review: {
        ...reviewData,
        generatedAt: new Date().toISOString()
      },
      month,
      year
    }), {
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
