import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { ArrowRight } from '@/components/ui/icons';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Failed to sign in');
          setIsLoading(false);
          return;
        }
        // Navigation handled by auth state change
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message || 'Failed to create account');
          setIsLoading(false);
          return;
        }
        toast.success('Account created! Welcome to Kagami.');
        // Navigation handled by auth state change
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen paper-texture flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and tagline */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-6">
            <DaoLogo size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-medium text-foreground mb-2 tracking-tight">
            Dao
          </h1>
          <p className="text-muted-foreground text-sm">
            Your career journey, mindfully tracked
          </p>
        </div>

        {/* Auth form */}
        <div className="journal-card">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-paper"
                  placeholder="How should we call you?"
                  required={!isLogin}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-paper"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-paper"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-serene w-full group"
            >
              {isLoading ? (
                <span className="opacity-70">One moment...</span>
              ) : (
                <>
                  {isLogin ? 'Sign in' : 'Create account'}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="brush-divider my-6" />

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-primary font-medium">Sign up</span></>
            ) : (
              <>Already have an account? <span className="text-primary font-medium">Sign in</span></>
            )}
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Begin your mindful journey of career reflection
        </p>
      </div>
    </div>
  );
}