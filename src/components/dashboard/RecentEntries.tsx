import { useState } from 'react';
import { Calendar, Target, Lightbulb, Compass, BookOpen } from '@/components/ui/icons';
import { EntryDetailSheet } from '@/components/entry/EntryDetailSheet';
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
  onClick: () => void;
}

function EntryCard({ entry, onClick }: EntryCardProps) {
  const allItems: { category: string; text: string }[] = [
    ...entry.achievements.map(text => ({ category: 'achievements', text })),
    ...entry.learnings.map(text => ({ category: 'learnings', text })),
    ...entry.insights.map(text => ({ category: 'insights', text })),
    ...entry.decisions.map(text => ({ category: 'decisions', text })),
  ];
  
  const displayItems = allItems.slice(0, 3);
  const remainingCount = allItems.length - 3;
  
  return (
    <button
      onClick={onClick}
      className="w-full text-left entry-card transition-colors cursor-pointer"
    >
      {/* Date header with cream stripe */}
      <div className="entry-card-header flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cedar" />
        <span className="text-sm font-medium text-cedar">
          {formatDate(entry.date)}
        </span>
      </div>
      
      {/* Entry content */}
      <div className="entry-card-body space-y-2">
        {displayItems.map((item, idx) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <div key={idx} className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-warm-body line-clamp-1">
                {item.text}
              </p>
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <p className="text-xs text-warm-secondary pl-5">
            +{remainingCount} more
          </p>
        )}
      </div>
    </button>
  );
}

interface RecentEntriesProps {
  entries: Entry[];
  isLoading: boolean;
  onUpdateEntry?: (id: string, updates: Partial<Entry>) => Promise<{ error?: Error } | undefined>;
  onDeleteEntry?: (id: string) => Promise<{ error?: Error } | undefined>;
}

export function RecentEntries({ entries, isLoading, onUpdateEntry, onDeleteEntry }: RecentEntriesProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  // Keep selected entry in sync with entries prop
  const currentEntry = selectedEntry 
    ? entries.find(e => e.id === selectedEntry.id) || null 
    : null;

  if (isLoading) {
    return (
      <div className="journal-card p-8 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-warm-secondary">Loading entries...</p>
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
        <h3 className="text-lg font-medium text-warm-primary mb-2">Your journal awaits</h3>
        <p className="text-sm text-warm-secondary max-w-xs mx-auto">
          Start capturing your achievements, learnings, and insights. Each entry builds your career story.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-warm-primary px-1">Recent Entries</h3>
        <div className="space-y-3">
          {recentEntries.map((entry) => (
            <EntryCard 
              key={entry.id} 
              entry={entry} 
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      </div>

      <EntryDetailSheet
        entry={currentEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onUpdate={onUpdateEntry}
        onDelete={onDeleteEntry}
      />
    </>
  );
}
