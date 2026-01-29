import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { ArrowRight, Edit3, Sparkles, TrendingUp } from '@/components/ui/icons';

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
  
  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen paper-texture flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <DaoLogo size={24} className="text-primary" />
          <span className="font-medium text-foreground">Dao</span>
        </div>
        <button
          onClick={() => navigate('/auth')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Log in
        </button>
      </header>
      
      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6 shadow-subtle">
            <DaoLogo size={32} className="text-primary" />
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-medium text-foreground mb-3 tracking-tight">
            Dao
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Your career journey, mindfully tracked
          </p>
          
          {/* CTA */}
          <button
            onClick={() => navigate('/auth')}
            className="btn-serene text-base px-8 py-3 group mb-16"
          >
            Start reflecting
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          
          {/* Features */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="journal-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">Capture</h3>
              <p className="text-xs text-muted-foreground">
                Record achievements and learnings as they happen
              </p>
            </div>
            
            <div className="journal-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">Reflect</h3>
              <p className="text-xs text-muted-foreground">
                AI-guided prompts help you dig deeper
              </p>
            </div>
            
            <div className="journal-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">Generate</h3>
              <p className="text-xs text-muted-foreground">
                Automatic reviews and resume bullets
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}