import { FileText, Target, Lightbulb } from '@/components/ui/icons';
import type { Entry } from '@/types';

interface QuickStatsProps {
  entries: Entry[];
}

export function QuickStats({ entries }: QuickStatsProps) {
  
  // Get current quarter
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
    <div className="journal-card p-4">
      <h3 className="text-sm font-medium text-warm-primary mb-4">
        Q{currentQuarter} Progress
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cedar" />
            <span className="text-sm text-warm-secondary">Entries</span>
          </div>
          <span className="text-sm font-medium text-warm-primary">
            {quarterEntries.length}
          </span>
        </div>
        
        <div className="brush-divider" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm text-warm-secondary">Achievements</span>
          </div>
          <span className="text-sm font-medium text-warm-primary">
            {totalAchievements}
          </span>
        </div>
        
        <div className="brush-divider" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-sm text-warm-secondary">Learnings</span>
          </div>
          <span className="text-sm font-medium text-warm-primary">
            {totalLearnings}
          </span>
        </div>
      </div>
      
      {thisMonthEntries.length === 0 && (
        <div className="mt-4 p-3 rounded-lg bg-sage-light/30 border border-sage-light">
          <p className="text-xs text-warm-secondary text-center">
            No entries yet this month. Start capturing your wins!
          </p>
        </div>
      )}
    </div>
  );
}