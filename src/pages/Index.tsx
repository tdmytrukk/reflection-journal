import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { ArrowRight } from '@/components/ui/icons';

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, isLoading: dataLoading } = useUserData();
  const navigate = useNavigate();
  
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 -mt-12">
        <div className="max-w-xl mx-auto text-center">
          {/* Subtle floating logo */}
          <div className="mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm">
              <DaoLogo size={28} />
            </div>
          </div>
          
          {/* Single headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-20 tracking-tight leading-tight animate-fade-in animation-delay-100">
            Your career journey,
            <br />
            <span className="text-foreground/70">mindfully tracked</span>
          </h1>
          
          {/* Primary action - clean and inviting */}
          <div className="animate-fade-in animation-delay-200">
            <button
              onClick={() => navigate('/auth')}
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-foreground text-background rounded-full text-sm font-medium transition-all duration-300 hover:gap-4 hover:shadow-lg hover:shadow-foreground/10"
            >
              Begin
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </main>
      
      {/* Breathing indicator - subtle life */}
      <div className="relative z-10 flex justify-center pb-12">
        <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse" />
      </div>
    </div>
  );
}
