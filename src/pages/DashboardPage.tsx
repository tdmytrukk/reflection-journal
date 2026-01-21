import { useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { WeeklyReflection } from '@/components/dashboard/WeeklyReflection';
import { QuarterlyCheckinBanner } from '@/components/dashboard/QuarterlyCheckinBanner';
import { NewEntryModal } from '@/components/entry/NewEntryModal';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { Plus, Sparkles, FileText } from '@/components/ui/icons';

export default function DashboardPage() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const { user } = useAuth();
  const { profile, jobDescription, entries, isLoading, refreshData, updateEntry, deleteEntry } = useUserData();
  const { matches, refreshData: refreshResponsibilities } = useResponsibilities();
  
  // Get current quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  
  // Daily rotating quotes about mindfulness, career, and growth
  const dailyQuotes = [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { quote: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { quote: "The unexamined life is not worth living.", author: "Socrates" },
    { quote: "Growth is the only evidence of life.", author: "John Henry Newman" },
    { quote: "What we think, we become.", author: "Buddha" },
    { quote: "Excellence is not a destination but a continuous journey.", author: "Brian Tracy" },
    { quote: "Be present in all things and thankful for all things.", author: "Maya Angelou" },
    { quote: "The mind is everything. What you think you become.", author: "Buddha" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
    { quote: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
    { quote: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
    { quote: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
    { quote: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
    { quote: "Your work is to discover your work and then with all your heart to give yourself to it.", author: "Buddha" },
    { quote: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { quote: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },
    { quote: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi" },
    { quote: "It is not the mountain we conquer, but ourselves.", author: "Edmund Hillary" },
    { quote: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.", author: "Socrates" },
    { quote: "Every moment is a fresh beginning.", author: "T.S. Eliot" },
    { quote: "The present moment is filled with joy and happiness. If you are attentive, you will see it.", author: "Thich Nhat Hanh" },
    { quote: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
    { quote: "What you do makes a difference, and you have to decide what kind of difference you want to make.", author: "Jane Goodall" },
    { quote: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { quote: "Small deeds done are better than great deeds planned.", author: "Peter Marshall" },
    { quote: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
    { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { quote: "A journey of self-discovery begins with a single question.", author: "Confucius" },
    { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
  ];
  
  // Get quote based on day of year for daily rotation
  const getDailyQuote = () => {
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dailyQuotes[dayOfYear % dailyQuotes.length];
  };
  
  const todayQuote = getDailyQuote();
  
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const userName = profile?.name || user?.email?.split('@')[0] || 'there';

  const handleEntrySaved = useCallback(() => {
    refreshData();
    refreshResponsibilities();
  }, [refreshData, refreshResponsibilities]);
  
  return (
    <div className="min-h-screen paper-texture">
      <DashboardHeader />
      
      <main className="max-w-[1260px] mx-auto px-8 lg:px-16 pt-16 pb-12">
        {/* Welcome section with quote */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-ink mb-2" style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.5px' }}>
            {getGreeting()}, {userName}
          </h1>
          <blockquote className="text-warm-muted font-display-italic" style={{ fontSize: '16px', fontWeight: 300, lineHeight: 1.5 }}>
            "{todayQuote.quote}" <span className="text-cedar">— {todayQuote.author}</span>
          </blockquote>
        </div>
        
        {/* Quarterly Check-in Banner */}
        <QuarterlyCheckinBanner />
        
        {/* Main grid - 60/40 split */}
        <div className="grid lg:grid-cols-[1fr_40%] gap-10">
          {/* Main content area */}
          <div className="space-y-8">
            {/* New entry card - RICH styling */}
            <button
              onClick={() => setIsNewEntryOpen(true)}
              className="w-full new-entry-card text-left group"
            >
              <div className="flex items-center gap-6">
                <div className="plus-icon-container">
                  <Plus className="w-7 h-7 text-moss" strokeWidth={2.5} strokeLinecap="round" />
                </div>
                <div>
                  <h3 className="text-warm-primary group-hover:text-moss transition-colors" style={{ fontSize: '20px', fontWeight: 500 }}>
                    New Entry
                  </h3>
                  <p className="text-warm-muted mt-1" style={{ fontSize: '15px' }}>
                    Capture today's achievements and learnings
                  </p>
                </div>
              </div>
            </button>
            
            {/* Decorative divider */}
            <div className="brush-divider" />
            
            {/* Recent entries */}
            <RecentEntries 
              entries={entries} 
              isLoading={isLoading} 
              matches={matches}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
            />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-8">
            {/* Weekly Reflection */}
            <WeeklyReflection entries={entries} />
            
            {/* Calendar */}
            <MiniCalendar entries={entries} />
            
            {/* Stats */}
            <QuickStats entries={entries} />
            
            {/* Quick actions */}
            <div className="sidebar-card space-y-3">
              <h3 className="text-warm-primary mb-4" style={{ fontSize: '16px', fontWeight: 500 }}>
                Quick Actions
              </h3>
              
              <button className="w-full btn-ghost justify-start text-left gap-4 py-3 rounded-xl hover:bg-[rgba(107,122,90,0.08)]">
                <div className="icon-container">
                  <Sparkles className="w-5 h-5 text-moss" strokeLinecap="round" />
                </div>
                <div>
                  <p className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>Generate Q{currentQuarter} Review</p>
                  <p className="text-warm-muted" style={{ fontSize: '13px' }}>Create your quarterly summary</p>
                </div>
              </button>
              
              <button className="w-full btn-ghost justify-start text-left gap-4 py-3 rounded-xl hover:bg-[rgba(107,122,90,0.08)]">
                <div className="icon-container">
                  <FileText className="w-5 h-5 text-moss" strokeLinecap="round" />
                </div>
                <div>
                  <p className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>Resume Bullets</p>
                  <p className="text-warm-muted" style={{ fontSize: '13px' }}>Export achievements as bullets</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* New Entry Modal */}
      <NewEntryModal 
        isOpen={isNewEntryOpen} 
        onClose={() => setIsNewEntryOpen(false)}
        onEntrySaved={handleEntrySaved}
      />
    </div>
  );
}
