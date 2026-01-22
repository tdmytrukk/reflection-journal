import { useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { MonthlyReview } from '@/components/dashboard/MonthlyReview';
import { QuarterlyCheckinBanner } from '@/components/dashboard/QuarterlyCheckinBanner';
import { NewEntryModal } from '@/components/entry/NewEntryModal';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { useProfileData } from '@/hooks/useProfileData';
import { Plus, Sparkles, FileText, ChevronDown } from '@/components/ui/icons';

export default function DashboardPage() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const { user } = useAuth();
  const { profile, jobDescription, entries, isLoading, refreshData, updateEntry, deleteEntry } = useUserData();
  const { matches, refreshData: refreshResponsibilities } = useResponsibilities();
  const { preferences } = useProfileData();
  
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
      
      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 pt-4 sm:pt-6 lg:pt-8 pb-8 lg:pb-12">
        {/* Quarterly Check-in Banner */}
        <QuarterlyCheckinBanner />
        
        {/* 
          Responsive grid:
          - Mobile (<768px): 1 column, stacked
          - Tablet (768-1023px): 2 columns [240px_1fr]
          - Desktop (≥1024px): 3 columns [280px_1fr_380px]
        */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr_380px] gap-4 md:gap-5 lg:gap-8">
          
          {/* Left column - Greeting, New Entry, Calendar (always first) */}
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            {/* Welcome section with quote - compact on mobile */}
            <div className="sidebar-card !p-4 md:!p-5 lg:!p-6 animate-fade-in">
              <h1 className="text-ink mb-1.5 md:mb-2 text-xl md:text-2xl lg:text-[28px]" style={{ fontWeight: 300, letterSpacing: '-0.3px' }}>
                {getGreeting()}, {userName}
              </h1>
              <blockquote className="text-warm-muted font-display-italic text-xs md:text-sm" style={{ fontWeight: 300, lineHeight: 1.5 }}>
                "{todayQuote.quote}" <span className="text-cedar">— {todayQuote.author}</span>
              </blockquote>
            </div>
            
            {/* New entry card */}
            {(() => {
              const entryPrompts = [
                "Wins, decisions, or moments you noticed.",
                "Not every entry has to be a win.",
                "Small moments count.",
                "Log it as you remember it.",
                "What stood out today is enough."
              ];
              const promptIndex = now.getDate() % entryPrompts.length;
              return (
                <button
                  onClick={() => setIsNewEntryOpen(true)}
                  className="w-full new-entry-card !p-5 md:!p-6 lg:!p-10 text-left group focus:outline-none focus:ring-0"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="plus-icon-container !w-10 !h-10 md:!w-12 md:!h-12 lg:!w-14 lg:!h-14">
                      <Plus className="w-5 h-5 md:w-6 md:h-6 text-moss" strokeWidth={2.5} strokeLinecap="round" />
                    </div>
                    <div>
                      <h3 className="text-warm-primary group-hover:text-moss transition-colors text-base md:text-[17px]" style={{ fontWeight: 500 }}>
                        New Entry
                      </h3>
                      <p className="text-warm-muted mt-0.5 text-xs md:text-[13px]">
                        {entryPrompts[promptIndex]}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })()}
            
            {/* Calendar - visible on tablet+ */}
            <div className="hidden md:block">
              <MiniCalendar entries={entries} />
            </div>
            
            {/* Quick actions - visible on tablet+ */}
            <div className="hidden md:block sidebar-card !p-4 lg:!p-6 space-y-2">
              <h3 className="text-warm-primary mb-2 lg:mb-3 text-sm lg:text-[15px]" style={{ fontWeight: 500 }}>
                Quick Actions
              </h3>
              
              <button className="w-full btn-ghost justify-start text-left gap-2 lg:gap-3 py-2 lg:py-2.5 rounded-xl hover:bg-[rgba(107,122,90,0.08)]">
                <div className="icon-container !w-7 !h-7 lg:!w-8 lg:!h-8">
                  <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-moss" strokeLinecap="round" />
                </div>
                <div>
                  <p className="text-warm-primary text-xs lg:text-[13px]" style={{ fontWeight: 500 }}>Generate Q{currentQuarter} Review</p>
                  <p className="text-warm-muted text-[11px] lg:text-xs">Create your quarterly summary</p>
                </div>
              </button>
              
              <button className="w-full btn-ghost justify-start text-left gap-2 lg:gap-3 py-2 lg:py-2.5 rounded-xl hover:bg-[rgba(107,122,90,0.08)]">
                <div className="icon-container !w-7 !h-7 lg:!w-8 lg:!h-8">
                  <FileText className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-moss" strokeLinecap="round" />
                </div>
                <div>
                  <p className="text-warm-primary text-xs lg:text-[13px]" style={{ fontWeight: 500 }}>Resume Bullets</p>
                  <p className="text-warm-muted text-[11px] lg:text-xs">Export achievements as bullets</p>
                </div>
              </button>
            </div>
          </div>
          
          {/* Middle column - Recent Entries (always second) */}
          <div className="space-y-4 md:space-y-5 lg:space-y-6">
            <RecentEntries 
              entries={entries} 
              isLoading={isLoading} 
              matches={matches}
              onUpdateEntry={updateEntry}
              onDeleteEntry={deleteEntry}
            />
            
            {/* This Month's Review - shown below entries on tablet, hidden on desktop (moves to right col) */}
            <div className="block lg:hidden">
              <MonthlyReview entries={entries} period={preferences?.recapPeriod || 'monthly'} />
            </div>
          </div>
          
          {/* Right column - Review (desktop only, always third) */}
          <div className="hidden lg:block space-y-6">
            <MonthlyReview entries={entries} period={preferences?.recapPeriod || 'monthly'} />
          </div>
        </div>
        
        {/* Mobile-only: Calendar at bottom, collapsible */}
        <div className="md:hidden mt-6">
          <details className="sidebar-card !p-4">
            <summary className="text-warm-primary text-sm font-medium cursor-pointer list-none flex items-center justify-between">
              <span>📅 View Calendar</span>
              <ChevronDown className="w-4 h-4 text-cedar transition-transform [[open]>&]:rotate-180" />
            </summary>
            <div className="mt-4">
              <MiniCalendar entries={entries} />
            </div>
          </details>
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
