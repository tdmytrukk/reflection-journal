import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { ArrowRight, Sparkles } from '@/components/ui/icons';

const reflectionPrompts = [
  "What decision did you make this week that wasn't straightforward?",
  "What moved forward this week, even if it felt small?",
  "What did you learn that changed how you think about your work?",
  "What was harder than expected this week?",
  "What are you proud of from this week?",
  "What did you handle for the first time?",
];

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: dataLoading } = useUserData();
  const navigate = useNavigate();
  const [promptIndex, setPromptIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (authLoading) return;
    
    if (user) {
      if (dataLoading) return;
      
      if (hasCompletedOnboarding) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    }
  }, [user, authLoading, hasCompletedOnboarding, dataLoading, navigate]);

  const handleNextPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % reflectionPrompts.length);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
  };

  const handleStartReflecting = () => {
    // Navigate to auth, could later pass prompt context
    navigate('/auth');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleStartReflecting();
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-warm-sand/20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-warm-sand/20 flex flex-col overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/3 bg-gradient-to-t from-warm-sand/10 to-transparent" />
      </div>
      
      {/* Minimal header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-6">
        <div className="flex items-center gap-2.5 opacity-80">
          <DaoLogo size={22} />
          <span className="text-sm font-medium text-foreground/80 tracking-wide">Dao</span>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          Log in
        </button>
      </header>
      
      {/* Hero - centered and breathing */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        <div className="max-w-xl mx-auto text-center w-full">
          {/* Subtle floating logo */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
              <DaoLogo size={24} />
            </div>
          </div>
          
          {/* Single headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-12 tracking-tight leading-tight animate-fade-in animation-delay-100">
            Your career journey,
            <br />
            <span className="text-foreground/60">mindfully tracked</span>
          </h1>
          
          {/* Interactive reflection prompt */}
          <div className="animate-fade-in animation-delay-200 mb-8">
            <div 
              className={`
                relative max-w-lg mx-auto bg-warm-sand/30 rounded-2xl p-5 
                transition-all duration-300 cursor-text
                ${isFocused ? 'bg-warm-sand/50 shadow-lg shadow-warm-sand/20' : 'hover:bg-warm-sand/40'}
              `}
              onClick={() => document.getElementById('reflection-input')?.focus()}
            >
              {/* Sparkle icon */}
              <div className="absolute left-5 top-5">
                <Sparkles className="w-4 h-4 text-primary/60" />
              </div>
              
              {/* Textarea */}
              <textarea
                id="reflection-input"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={reflectionPrompts[promptIndex]}
                className="w-full bg-transparent border-none outline-none resize-none text-foreground placeholder:text-foreground/70 text-[15px] leading-relaxed pl-7 min-h-[28px] max-h-32"
                rows={1}
              />
              
              {/* Try another link */}
              <div className="flex justify-start pl-7 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPrompt();
                  }}
                  className="inline-flex items-center gap-1.5 text-primary/70 hover:text-primary text-sm transition-colors duration-200 group"
                >
                  Try another
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Primary action - appears when typing */}
          <div className={`animate-fade-in animation-delay-300 transition-all duration-300 ${inputValue ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
            <button
              onClick={handleStartReflecting}
              className="group inline-flex items-center gap-3 px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium transition-all duration-300 hover:gap-4 hover:shadow-lg hover:shadow-foreground/10"
            >
              Continue reflecting
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
          
          {/* Subtle hint when not typing */}
          <div className={`transition-all duration-300 ${inputValue ? 'opacity-0' : 'opacity-100'}`}>
            <p className="text-muted-foreground/60 text-xs mt-6">
              Start typing to begin your reflection
            </p>
          </div>
        </div>
      </main>
      
      {/* Breathing indicator - subtle life */}
      <div className="relative z-10 flex justify-center pb-10">
        <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
      </div>
    </div>
  );
}
