import { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentEntries } from '@/components/dashboard/RecentEntries';
import { WeeklyReflection } from '@/components/dashboard/WeeklyReflection';
import { NewEntryModal } from '@/components/entry/NewEntryModal';
import { useApp } from '@/context/AppContext';
import { Plus, Sparkles, FileText } from '@/components/ui/icons';

export default function DashboardPage() {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const { userName, jobDescription } = useApp();
  
  // Get current quarter
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  
  return (
    <div className="min-h-screen paper-texture">
      <DashboardHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-medium text-foreground mb-1">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-muted-foreground">
            {jobDescription?.title && jobDescription?.company 
              ? `${jobDescription.title} at ${jobDescription.company}`
              : 'Ready to capture your achievements?'
            }
          </p>
        </div>
        
        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* New entry card */}
            <button
              onClick={() => setIsNewEntryOpen(true)}
              className="w-full journal-card p-6 text-left group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                    New Entry
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Capture today's achievements and learnings
                  </p>
                </div>
              </div>
            </button>
            
            {/* Recent entries */}
            <RecentEntries />
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Weekly Reflection */}
            <WeeklyReflection />
            
            {/* Calendar */}
            <MiniCalendar />
            
            {/* Stats */}
            <QuickStats />
            
            {/* Quick actions */}
            <div className="journal-card p-4 space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Quick Actions
              </h3>
              
              <button className="w-full btn-ghost justify-start text-left gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Generate Q{currentQuarter} Review</p>
                  <p className="text-xs text-muted-foreground">Create your quarterly summary</p>
                </div>
              </button>
              
              <button className="w-full btn-ghost justify-start text-left gap-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-sage-light flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Resume Bullets</p>
                  <p className="text-xs text-muted-foreground">Export achievements as bullets</p>
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
      />
    </div>
  );
}
