import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { RistLogo } from '@/components/icons/RistLogo';
import { ArrowRight, FileText, Sparkles } from '@/components/ui/icons';
import type { JobDescription } from '@/types';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescContent, setJobDescContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { userName, completeOnboarding } = useApp();
  const navigate = useNavigate();

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
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const responsibilities = extractResponsibilities(jobDescContent);
    
    const jobDesc: JobDescription = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      title: jobTitle,
      company: company,
      content: jobDescContent,
      responsibilities,
      startDate: new Date(),
      createdAt: new Date(),
    };
    
    completeOnboarding(jobDesc);
    setIsProcessing(false);
    navigate('/dashboard');
  };

  const handleSkip = () => {
    const jobDesc: JobDescription = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      title: 'Professional',
      company: 'My Company',
      content: '',
      responsibilities: [],
      startDate: new Date(),
      createdAt: new Date(),
    };
    
    completeOnboarding(jobDesc);
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
                Share your role
              </h1>
              <p className="text-muted-foreground">
                This helps us match your achievements to your responsibilities
              </p>
            </>
          )}
        </div>

        {/* Step 1: Role basics */}
        {step === 1 && (
          <div className="journal-card space-y-6">
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="btn-ghost flex-1"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!jobTitle || !company}
                className="btn-serene flex-1 group disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Job description */}
        {step === 2 && (
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Paste your job description
              </label>
              <textarea
                value={jobDescContent}
                onChange={(e) => setJobDescContent(e.target.value)}
                className="textarea-journal min-h-[200px]"
                placeholder="Paste the key responsibilities from your job description here..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="btn-ghost flex-1"
              >
                Skip for now
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
