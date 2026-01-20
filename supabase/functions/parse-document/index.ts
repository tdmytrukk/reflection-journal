import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    let rawText = '';

    // Handle plain text files directly
    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      rawText = await file.text();
    }
    // Handle PDF and DOCX via Lovable AI (Gemini)
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const mimeType = fileName.endsWith('.pdf') 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      // Use tool calling to extract structured data
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyze this job description document and extract the key information for someone who ALREADY HAS this job and wants to track their achievements against their responsibilities.

Extract:
1. The exact job title
2. The company name
3. Key responsibilities and goals for this role (what the person in this job is expected to DO and ACHIEVE)
4. Any company-wide goals or mission mentioned (from About Us or company description sections)

IMPORTANT: 
- Skip any "requirements", "qualifications", or "ideal candidate" sections - the person already has the job
- Focus only on what the role is responsible for and what success looks like
- Keep responsibilities as concise bullet points`,
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
                name: 'extract_job_info',
                description: 'Extract structured job information from a job description document',
                parameters: {
                  type: 'object',
                  properties: {
                    jobTitle: {
                      type: 'string',
                      description: 'The job title exactly as stated in the document',
                    },
                    company: {
                      type: 'string',
                      description: 'The company name',
                    },
                    responsibilities: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'List of key responsibilities and goals for this role (what the person does and achieves)',
                    },
                    companyGoals: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Company-wide goals or mission statements if mentioned',
                    },
                  },
                  required: ['jobTitle', 'company', 'responsibilities'],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'extract_job_info' } },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', errorText);
        throw new Error('Failed to extract information from document');
      }

      const aiResponse = await response.json();
      
      // Extract the tool call result
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall && toolCall.function?.arguments) {
        const extractedData = JSON.parse(toolCall.function.arguments);
        
        return new Response(
          JSON.stringify({
            jobTitle: extractedData.jobTitle || '',
            company: extractedData.company || '',
            responsibilities: extractedData.responsibilities || [],
            companyGoals: extractedData.companyGoals || [],
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to parse document structure');
    }
    // Legacy .doc format not supported
    else if (fileName.endsWith('.doc')) {
      return new Response(
        JSON.stringify({ error: 'Legacy .doc format is not supported. Please save as .docx or .txt.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // Try to read as plain text
    else {
      rawText = await file.text();
    }

    // For plain text files, also use AI to extract structured data
    if (rawText) {
      const apiKey = Deno.env.get('LOVABLE_API_KEY');
      if (!apiKey) {
        // Fallback: return raw text if no API key
        return new Response(
          JSON.stringify({ text: rawText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'user',
              content: `Analyze this job description and extract the key information for someone who ALREADY HAS this job.

Job Description:
${rawText}

Extract:
1. The exact job title
2. The company name
3. Key responsibilities and goals (what the person does and achieves)
4. Company-wide goals or mission if mentioned

IMPORTANT: Skip requirements/qualifications sections - focus only on responsibilities and goals.`,
            },
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_job_info',
                description: 'Extract structured job information from a job description',
                parameters: {
                  type: 'object',
                  properties: {
                    jobTitle: {
                      type: 'string',
                      description: 'The job title exactly as stated',
                    },
                    company: {
                      type: 'string',
                      description: 'The company name',
                    },
                    responsibilities: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'List of key responsibilities and goals',
                    },
                    companyGoals: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Company-wide goals or mission statements',
                    },
                  },
                  required: ['jobTitle', 'company', 'responsibilities'],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: 'function', function: { name: 'extract_job_info' } },
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall && toolCall.function?.arguments) {
          const extractedData = JSON.parse(toolCall.function.arguments);
          
          return new Response(
            JSON.stringify({
              jobTitle: extractedData.jobTitle || '',
              company: extractedData.company || '',
              responsibilities: extractedData.responsibilities || [],
              companyGoals: extractedData.companyGoals || [],
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Fallback to raw text
      return new Response(
        JSON.stringify({ text: rawText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'No content extracted' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Document parsing error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process document';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
