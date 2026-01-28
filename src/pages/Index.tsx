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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card border border-border mb-8 shadow-sm">
            <DaoLogo size={40} className="text-primary" />
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl font-medium text-foreground mb-4 tracking-tight">
            Dao
          </h1>
          
          <p className="text-xl text-muted-foreground mb-2 font-serif-jp">
            Your career journey, mindfully tracked
          </p>
          
          <p className="text-base text-muted-foreground mb-10 max-w-md mx-auto">
            A serene space to capture achievements, reflect on learnings, and prepare for your next milestone.
          </p>
          
          {/* CTA */}
          <button
            onClick={() => navigate('/auth')}
            className="btn-serene text-base px-8 py-3 group"
          >
            Begin your journey
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </main>
      
      {/* Features hint */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="journal-card p-6 text-center">
              <div className="text-2xl mb-3">📝</div>
              <h3 className="font-medium text-foreground mb-1">Capture</h3>
              <p className="text-sm text-muted-foreground">
                Record achievements and learnings as they happen
              </p>
            </div>
            
            <div className="journal-card p-6 text-center">
              <div className="text-2xl mb-3">✨</div>
              <h3 className="font-medium text-foreground mb-1">Reflect</h3>
              <p className="text-sm text-muted-foreground">
                AI-guided prompts help you dig deeper
              </p>
            </div>
            
            <div className="journal-card p-6 text-center">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="font-medium text-foreground mb-1">Generate</h3>
              <p className="text-sm text-muted-foreground">
                Automatic reviews and resume bullets
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-xs text-muted-foreground">
          Built for professionals who value intentional career growth
        </p>
      </footer>
    </div>
  );
}