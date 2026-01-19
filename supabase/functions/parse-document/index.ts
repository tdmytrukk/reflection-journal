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
    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      // Parse PDF using pdf-parse via esm.sh
      const pdfParse = (await import("https://esm.sh/pdf-parse@1.1.1")).default;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      
      try {
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return new Response(
          JSON.stringify({ error: 'Failed to parse PDF. The file may be corrupted or password-protected.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (fileName.endsWith('.docx')) {
      // Parse DOCX using mammoth
      const mammoth = await import("https://esm.sh/mammoth@1.6.0");
      const arrayBuffer = await file.arrayBuffer();
      
      try {
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return new Response(
          JSON.stringify({ error: 'Failed to parse Word document. Please try saving as .txt.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (fileName.endsWith('.doc')) {
      return new Response(
        JSON.stringify({ error: 'Legacy .doc format is not supported. Please save as .docx or .txt.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Try to read as plain text
      extractedText = await file.text();
    }

    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Document parsing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process document' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
