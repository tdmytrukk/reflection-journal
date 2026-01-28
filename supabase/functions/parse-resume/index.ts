import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let requestBody: any;

    // Handle PDF and DOCX with file upload
    if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const mimeType = fileName.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      requestBody = {
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this resume/CV document and extract all work experience entries.

For each job/position, extract:
1. Job title
2. Company name
3. Start date (month and year)
4. End date (month and year, or "Present" if current)
5. Description with bullet points - IMPORTANT: Preserve the exact bullet points from the resume. Keep each bullet point on its own line, prefixed with "• " (bullet character). Do NOT summarize or combine bullets.

Return ALL positions found, ordered from most recent to oldest.
Parse dates in YYYY-MM format (e.g., "2024-06" for June 2024).
If only a year is given, use January of that year (e.g., "2024" becomes "2024-01").
If the position is current/ongoing, set endDate to null.`,
              },
              {
                type: 'file',
                file: {
                  filename: file.name,
                  file_data: `data:${mimeType};base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_work_history',
              description: 'Extract work history from a resume',
              parameters: {
                type: 'object',
                properties: {
                  positions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Job title' },
                        company: { type: 'string', description: 'Company name' },
                        startDate: { type: 'string', description: 'Start date in YYYY-MM format' },
                        endDate: { type: 'string', nullable: true, description: 'End date in YYYY-MM format, or null if current' },
                        description: { type: 'string', description: 'Full description with bullet points preserved. Each bullet should be on its own line prefixed with • character' },
                      },
                      required: ['title', 'company', 'startDate'],
                    },
                    description: 'List of work positions from most recent to oldest',
                  },
                },
                required: ['positions'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_work_history' } },
      };
    }
    // Handle plain text
    else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const rawText = await file.text();
      
      requestBody = {
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: `Analyze this resume/CV text and extract all work experience entries.

Resume:
${rawText}

For each job/position, extract:
1. Job title
2. Company name
3. Start date (month and year)
4. End date (month and year, or "Present" if current)
5. Description with bullet points - IMPORTANT: Preserve the exact bullet points from the resume. Keep each bullet point on its own line, prefixed with "• " (bullet character). Do NOT summarize or combine bullets.

Return ALL positions found, ordered from most recent to oldest.
Parse dates in YYYY-MM format (e.g., "2024-06" for June 2024).`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_work_history',
              description: 'Extract work history from a resume',
              parameters: {
                type: 'object',
                properties: {
                  positions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Job title' },
                        company: { type: 'string', description: 'Company name' },
                        startDate: { type: 'string', description: 'Start date in YYYY-MM format' },
                        endDate: { type: 'string', nullable: true, description: 'End date in YYYY-MM format, or null if current' },
                        description: { type: 'string', description: 'Full description with bullet points preserved. Each bullet should be on its own line prefixed with • character' },
                      },
                      required: ['title', 'company', 'startDate'],
                    },
                    description: 'List of work positions from most recent to oldest',
                  },
                },
                required: ['positions'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_work_history' } },
      };
    }
    else if (fileName.endsWith('.doc')) {
      return new Response(
        JSON.stringify({ error: 'Legacy .doc format is not supported. Please save as .docx, .pdf, or .txt.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Unsupported file format. Please upload a PDF, DOCX, or TXT file.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error('Failed to extract information from resume');
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function?.arguments) {
      const extractedData = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({
          positions: extractedData.positions || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Failed to parse resume structure');
  } catch (error: unknown) {
    console.error('Resume parsing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process resume';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
