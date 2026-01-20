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
      className="w-full text-left entry-card cursor-pointer"
    >
      {/* Date header with cream background */}
      <div className="entry-card-header flex items-center gap-2">
        <Calendar className="w-4 h-4 text-cedar" strokeLinecap="round" />
        <span className="text-warm-secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
          {formatDate(entry.date)}
        </span>
      </div>
      
      {/* Entry content */}
      <div className="entry-card-body space-y-3">
        {displayItems.map((item, idx) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <div key={idx} className="flex items-start gap-3">
              <Icon className="w-5 h-5 text-moss flex-shrink-0 mt-0.5" strokeLinecap="round" />
              <p className="text-warm-body line-clamp-1" style={{ fontSize: '14px', lineHeight: 1.6, paddingLeft: '4px' }}>
                {item.text}
              </p>
            </div>
          );
        })}
        
        {remainingCount > 0 && (
          <p className="text-warm-muted pl-8" style={{ fontSize: '13px' }}>
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

  const currentEntry = selectedEntry 
    ? entries.find(e => e.id === selectedEntry.id) || null 
    : null;

  if (isLoading) {
    return (
      <div className="journal-card p-8 text-center">
        <div className="w-8 h-8 border-2 border-moss border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-warm-secondary" style={{ fontSize: '14px' }}>Loading entries...</p>
      </div>
    );
  }

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recentEntries.length === 0) {
    return (
      <div className="journal-card p-10 text-center">
        <div className="icon-container icon-container-lg mx-auto mb-5">
          <BookOpen className="w-6 h-6 text-moss" strokeLinecap="round" />
        </div>
        <h3 className="text-warm-primary mb-2" style={{ fontSize: '18px', fontWeight: 500 }}>Your journal awaits</h3>
        <p className="text-warm-secondary max-w-xs mx-auto" style={{ fontSize: '14px', lineHeight: 1.6 }}>
          Start capturing your achievements, learnings, and insights. Each entry builds your career story.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-warm-primary px-1" style={{ fontSize: '15px', fontWeight: 500 }}>Recent Entries</h3>
        <div className="space-y-4">
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
