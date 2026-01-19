import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { RistLogo } from '@/components/icons/RistLogo';
import { ArrowRight, FileText, Loader2, Sparkles, Upload, X, Edit3 } from '@/components/ui/icons';
import { useToast } from '@/hooks/use-toast';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescContent, setJobDescContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { profile, saveJobDescription } = useUserData();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userName = profile?.name || user?.user_metadata?.name || 'there';

  const parseDocumentWithEdgeFunction = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-document`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse document');
    }

    const data = await response.json();
    return data.text;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Handle text-based files directly in browser
    if (file.type === 'text/plain' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const text = await file.text();
      setJobDescContent(text);
      setUploadedFileName(file.name);
      // Auto-advance to step 2 after successful upload
      setStep(2);
    } 
    // Handle PDF and DOCX via edge function
    else if (fileName.endsWith('.pdf') || fileName.endsWith('.docx')) {
      setIsUploadingFile(true);
      setUploadedFileName(file.name);
      
      try {
        const extractedText = await parseDocumentWithEdgeFunction(file);
        setJobDescContent(extractedText);
        toast({
          title: 'Document parsed successfully',
          description: `Extracted text from ${file.name}`,
        });
        // Auto-advance to step 2 after successful upload
        setStep(2);
      } catch (error) {
        console.error('File parsing error:', error);
        setUploadedFileName(null);
        toast({
          title: 'Failed to parse document',
          description: error instanceof Error ? error.message : 'Please try a different file or enter details manually.',
          variant: 'destructive',
        });
      } finally {
        setIsUploadingFile(false);
      }
    }
    // Legacy .doc format not supported
    else if (fileName.endsWith('.doc')) {
      toast({
        title: 'Format not supported',
        description: 'Please save as .docx or .txt and try again.',
        variant: 'destructive',
      });
    }
    // Try reading as plain text
    else {
      try {
        const text = await file.text();
        setJobDescContent(text);
        setUploadedFileName(file.name);
        setStep(2);
      } catch {
        toast({
          title: 'Unable to read file',
          description: 'Please enter your job details manually.',
          variant: 'destructive',
        });
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearUploadedFile = () => {
    setUploadedFileName(null);
    setJobDescContent('');
  };

  const extractResponsibilities = (content: string): string[] => {
    // Simple extraction - split by newlines and filter meaningful lines
    const lines = content.split('\n').map(line => line.trim()).filter(line => {
      if (line.length < 10) return false;
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) return true;
      if (/^\d+\./.test(line)) return true;
      return line.length > 20 && line.length < 200;
    });
    
    return lines.slice(0, 10).map(line => 
      line.replace(/^[-•*\d.]+\s*/, '').trim()
    );
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    
    const responsibilities = extractResponsibilities(jobDescContent);
    
    await saveJobDescription({
      title: jobTitle || 'Professional',
      company: company || 'My Company',
      content: jobDescContent,
      responsibilities,
      startDate: new Date(),
    });
    
    setIsProcessing(false);
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    await saveJobDescription({
      title: 'Professional',
      company: 'My Company',
      content: '',
      responsibilities: [],
      startDate: new Date(),
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen paper-texture flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-card border border-border mb-4">
            <RistLogo size={24} className="text-primary" />
          </div>
          
          {step === 1 && (
            <>
              <h1 className="text-2xl font-medium text-foreground mb-2">
                Welcome, {userName}
              </h1>
              <p className="text-muted-foreground">
                Let's set up your workspace for meaningful reflection
              </p>
            </>
          )}
          
          {step === 2 && (
            <>
              <h1 className="text-2xl font-medium text-foreground mb-2">
                Complete your profile
              </h1>
              <p className="text-muted-foreground">
                Add your role details to match achievements to responsibilities
              </p>
            </>
          )}
        </div>

        {/* Step 1: Upload job description */}
        {step === 1 && (
          <div className="journal-card space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-sage-light/50 border border-sage-light">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Why add your job description?</p>
                <p className="text-muted-foreground">
                  We'll use it to match your achievements to your responsibilities and generate meaningful performance reviews.
                </p>
              </div>
            </div>

            {/* File Upload Option */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Upload your job description
              </label>
              
              {/* Upload area */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="job-desc-upload"
                />
                
                {isUploadingFile ? (
                  <div className="flex flex-col items-center gap-2 p-8 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm text-foreground">
                      Parsing {uploadedFileName}...
                    </span>
                    <span className="text-xs text-muted-foreground">
                      This may take a few seconds
                    </span>
                  </div>
                ) : (
                  <label
                    htmlFor="job-desc-upload"
                    className="flex flex-col items-center gap-3 p-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-medium text-foreground block">
                        Click to upload your job description
                      </span>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        PDF, Word, or text files supported
                      </span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Manual entry option */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Edit3 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground">Enter details manually</span>
            </button>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Role details (manual entry or after upload) */}
        {step === 2 && (
          <div className="journal-card space-y-6">
            {/* Show uploaded file if exists */}
            {uploadedFileName && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="flex-1 text-sm text-foreground truncate">{uploadedFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearUploadedFile();
                    setStep(1);
                  }}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Your current job title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="input-paper"
                placeholder="e.g., Senior Product Manager"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="input-paper"
                placeholder="Where do you work?"
              />
            </div>

            {/* Job description text area - only show if no file uploaded */}
            {!uploadedFileName && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Job description <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  value={jobDescContent}
                  onChange={(e) => setJobDescContent(e.target.value)}
                  className="textarea-journal min-h-[120px]"
                  placeholder="Paste your key responsibilities here..."
                />
              </div>
            )}

            {/* Show extracted content preview if file was uploaded */}
            {uploadedFileName && jobDescContent && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Extracted content
                </label>
                <div className="p-3 rounded-lg bg-muted/50 border border-border max-h-[200px] overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                    {jobDescContent.slice(0, 500)}{jobDescContent.length > 500 ? '...' : ''}
                  </pre>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (uploadedFileName) {
                    clearUploadedFile();
                  }
                  setStep(1);
                }}
                className="btn-ghost"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={isProcessing}
                className="btn-serene flex-1 group"
              >
                {isProcessing ? (
                  <span className="opacity-70">Setting up...</span>
                ) : (
                  <>
                    Complete setup
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-8">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
        </div>
      </div>
    </div>
  );
}
