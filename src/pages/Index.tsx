import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { Sparkles, CornerDownLeft } from '@/components/ui/icons';

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
  const [responses, setResponses] = useState<{ prompt: string; response: string }[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    
    // Save response
    const newResponse = {
      prompt: reflectionPrompts[promptIndex],
      response: inputValue.trim()
    };
    setResponses(prev => [...prev, newResponse]);
    
    // Transition to next question
    setIsTransitioning(true);
    setTimeout(() => {
      setInputValue('');
      setPromptIndex((prev) => (prev + 1) % reflectionPrompts.length);
      setIsTransitioning(false);
    }, 150);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
      
      {/* Hero - centered */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-8">
        <div className="max-w-2xl mx-auto text-center w-full">
          {/* Subtle floating logo */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
              <DaoLogo size={24} />
            </div>
          </div>
          
          {/* Single headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-10 tracking-tight leading-tight animate-fade-in animation-delay-100">
            Your career journey,
            <br />
            <span className="text-foreground/60">mindfully tracked</span>
          </h1>
          
          {/* Interactive reflection prompt box */}
          <div className="animate-fade-in animation-delay-200">
            <div className="max-w-xl mx-auto bg-warm-sand/50 rounded-2xl overflow-hidden shadow-sm border border-warm-sand/60">
              {/* Question header */}
              <div className={`flex items-start gap-3 p-4 pb-3 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <Sparkles className="w-5 h-5 text-primary/70 mt-0.5 flex-shrink-0" />
                <p className="text-foreground text-[15px] leading-relaxed text-left flex-1">
                  {reflectionPrompts[promptIndex]}
                </p>
              </div>
              
              {/* Input area */}
              <div className="flex items-center gap-3 px-4 pb-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="flex-1 bg-card/80 border border-border/50 rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground/60 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                    ${inputValue.trim() 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
                      : 'bg-muted text-muted-foreground/40'}
                  `}
                >
                  <CornerDownLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Response count indicator */}
            {responses.length > 0 && (
              <p className="text-muted-foreground/50 text-xs mt-4">
                {responses.length} reflection{responses.length !== 1 ? 's' : ''} captured
              </p>
            )}
          </div>
        </div>
      </main>
      
      {/* Breathing indicator */}
      <div className="relative z-10 flex justify-center pb-10">
        <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
      </div>
    </div>
  );
}
