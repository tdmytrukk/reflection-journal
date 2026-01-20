import { FileText, Target, Lightbulb } from '@/components/ui/icons';
import type { Entry } from '@/types';

interface QuickStatsProps {
  entries: Entry[];
}

export function QuickStats({ entries }: QuickStatsProps) {
  
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
  const quarterStartMonth = (currentQuarter - 1) * 3;
  
  const quarterEntries = entries.filter(e => {
    const date = new Date(e.date);
    const month = date.getMonth();
    return date.getFullYear() === now.getFullYear() && 
           month >= quarterStartMonth && 
           month < quarterStartMonth + 3;
  });
  
  const thisMonthEntries = entries.filter(e => {
    const date = new Date(e.date);
    return date.getFullYear() === now.getFullYear() && 
           date.getMonth() === now.getMonth();
  });
  
  const totalAchievements = quarterEntries.reduce(
    (sum, e) => sum + e.achievements.length, 0
  );
  
  const totalLearnings = quarterEntries.reduce(
    (sum, e) => sum + e.learnings.length, 0
  );
  
  return (
    <div className="sidebar-card">
      <h3 className="text-warm-primary mb-5" style={{ fontSize: '16px', fontWeight: 500 }}>
        Q{currentQuarter} Progress
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-cedar" strokeLinecap="round" />
            <span className="text-warm-secondary" style={{ fontSize: '14px' }}>Entries</span>
          </div>
          <span className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>
            {quarterEntries.length}
          </span>
        </div>
        
        <div className="brush-divider !my-3 !w-full" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-4 h-4 text-moss" strokeLinecap="round" />
            <span className="text-warm-secondary" style={{ fontSize: '14px' }}>Achievements</span>
          </div>
          <span className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>
            {totalAchievements}
          </span>
        </div>
        
        <div className="brush-divider !my-3 !w-full" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-4 h-4 text-moss" strokeLinecap="round" />
            <span className="text-warm-secondary" style={{ fontSize: '14px' }}>Learnings</span>
          </div>
          <span className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>
            {totalLearnings}
          </span>
        </div>
      </div>
      
      {thisMonthEntries.length === 0 && (
        <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(107, 122, 90, 0.06)', border: '1px solid rgba(107, 122, 90, 0.12)' }}>
          <p className="text-warm-secondary text-center" style={{ fontSize: '13px' }}>
            No entries yet this month. Start capturing your wins!
          </p>
        </div>
      )}
    </div>
  );
}
