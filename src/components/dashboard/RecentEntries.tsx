import { useUserData } from '@/hooks/useUserData';
import { Calendar, Target, Lightbulb, Compass, BookOpen } from '@/components/ui/icons';
import type { Entry } from '@/types';

const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'achievements': return Target;
    case 'learnings': return Lightbulb;
    case 'insights': return Compass;
    case 'decisions': return BookOpen;
    default: return Target;
  }
};

interface EntryCardProps {
  entry: Entry;
}

function EntryCard({ entry }: EntryCardProps) {
  const allItems: { category: string; text: string }[] = [
    ...entry.achievements.map(text => ({ category: 'achievements', text })),
    ...entry.learnings.map(text => ({ category: 'learnings', text })),
    ...entry.insights.map(text => ({ category: 'insights', text })),
    ...entry.decisions.map(text => ({ category: 'decisions', text })),
  ];
  
  const displayItems = allItems.slice(0, 3);
  const remainingCount = allItems.length - 3;
  
  return (
    <div className="journal-card p-4 hover:border-primary/30 transition-colors cursor-pointer">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          {formatDate(entry.date)}
        </span>
      </div>
      
      <div className="space-y-2">
        {displayItems.map((item, idx) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <div key={idx} className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground line-clamp-1">
                {item.text}
              </p>
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <p className="text-xs text-muted-foreground pl-5">
            +{remainingCount} more
          </p>
        )}
      </div>
    </div>
  );
}

export function RecentEntries() {
  const { entries, isLoading } = useUserData();

  if (isLoading) {
    return (
      <div className="journal-card p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Loading entries...</p>
      </div>
    );
  }

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recentEntries.length === 0) {
    return (
      <div className="journal-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-sage-light/50 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Your journal awaits</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Start capturing your achievements, learnings, and insights. Each entry builds your career story.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground px-1">Recent Entries</h3>
      <div className="space-y-3">
        {recentEntries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
