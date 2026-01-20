import { useState, useCallback } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { WeeklyReflection } from '@/components/dashboard/WeeklyReflection';
import { NewEntryModal } from '@/components/entry/NewEntryModal';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { Plus, Sparkles, FileText } from '@/components/ui/icons';

export default function DashboardPage() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const { user } = useAuth();
  const { profile, jobDescription, entries, isLoading, refreshData, updateEntry, deleteEntry } = useUserData();
  
  // Get current quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  const userName = profile?.name || user?.email?.split('@')[0] || 'there';

  const handleEntrySaved = useCallback(() => {
    refreshData();
  }, [refreshData]);
  
  return (
    <div className="min-h-screen paper-texture">
      <DashboardHeader />
      
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-16 pb-12">
        {/* Welcome section */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-ink mb-2" style={{ fontSize: '36px', fontWeight: 300, letterSpacing: '-0.5px' }}>
            {getGreeting()}, {userName}
          </h1>
          <p className="font-display-italic text-cedar" style={{ fontSize: '15px' }}>
            {jobDescription?.title && jobDescription?.company 
              ? `${jobDescription.title} at ${jobDescription.company}`
              : 'Ready to capture your achievements?'
            }
          </p>
        </div>
        
        {/* Main grid - 65/35 split */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-10">
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
