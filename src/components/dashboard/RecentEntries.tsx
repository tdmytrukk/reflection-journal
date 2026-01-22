import { useState, useRef, useEffect } from 'react';
import { Calendar, Trophy, Lightbulb, Compass, BookOpen, Link2, ChevronRight } from 'lucide-react';
import { EntryDetailSheet } from '@/components/entry/EntryDetailSheet';
import { Badge } from '@/components/ui/badge';
import type { Entry, ResponsibilityMatch } from '@/types';

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
    case 'achievements': return Trophy;
    case 'learnings': return Lightbulb;
    case 'insights': return Compass;
    case 'decisions': return BookOpen;
    default: return Trophy;
  }
};

interface EntryCardProps {
  entry: Entry;
  onClick: () => void;
  matchCount?: number;
}

function EntryCard({ entry, onClick, matchCount = 0 }: EntryCardProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  
  const allItems: { category: string; text: string }[] = [
    ...entry.achievements.map(text => ({ category: 'achievements', text })),
    ...entry.learnings.map(text => ({ category: 'learnings', text })),
    ...entry.insights.map(text => ({ category: 'insights', text })),
    ...entry.decisions.map(text => ({ category: 'decisions', text })),
  ];
  
  // Show first item only per entry for compact view
  const primaryItem = allItems[0];
  
  // Check if text is actually truncated
  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight);
      }
    };
    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [primaryItem?.text]);
  
  if (!primaryItem) return null;
  
  const Icon = getCategoryIcon(primaryItem.category);
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left entry-card cursor-pointer group ${matchCount > 0 ? 'ring-1 ring-moss/30' : ''}`}
    >
      {/* Date header with cream background */}
      <div className="entry-card-header !py-2 !px-3 md:!py-2.5 md:!px-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-cedar" strokeLinecap="round" />
          <span className="text-warm-secondary text-xs md:text-sm" style={{ fontWeight: 500 }}>
            {formatDate(entry.date)}
          </span>
        </div>
        {matchCount > 0 && (
          <Badge variant="outline" className="text-[10px] md:text-xs border-moss/50 text-moss bg-moss/5 !py-0.5 !px-1.5 md:!py-1 md:!px-2">
            <Link2 className="w-2.5 h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
            {matchCount} {matchCount === 1 ? 'resp.' : 'resp.'}
          </Badge>
        )}
      </div>
      
      {/* Entry content - show 3 lines */}
      <div className="entry-card-body !p-3 md:!p-4 relative">
        <div className="flex items-start gap-2 md:gap-3">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-moss flex-shrink-0 mt-0.5" strokeLinecap="round" />
          <div className="flex-1 min-w-0 pr-6 md:pr-8">
            <p 
              ref={textRef}
              className="text-warm-body line-clamp-3 text-xs md:text-sm" 
              style={{ lineHeight: 1.6 }}
            >
              {primaryItem.text}
            </p>
            {isTruncated && (
              <span className="text-warm-muted mt-1 inline-block text-[10px] md:text-xs">
                ...
              </span>
            )}
          </div>
        </div>
        
        {/* Chevron to open full entry - always present */}
        <div className="absolute bottom-0 right-0 p-1 text-cedar/60 group-hover:text-moss transition-colors">
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
    </button>
  );
}

interface RecentEntriesProps {
  entries: Entry[];
  isLoading: boolean;
  matches?: ResponsibilityMatch[];
  onUpdateEntry?: (id: string, updates: Partial<Entry>) => Promise<{ error?: Error } | undefined>;
  onDeleteEntry?: (id: string) => Promise<{ error?: Error } | undefined>;
}

export function RecentEntries({ entries, isLoading, matches = [], onUpdateEntry, onDeleteEntry }: RecentEntriesProps) {
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  // Count matches per entry
  const getMatchCountForEntry = (entryId: string) => {
    const entryMatches = matches.filter(m => m.entryId === entryId);
    // Count unique responsibilities
    const uniqueResponsibilities = new Set(entryMatches.map(m => m.responsibilityIndex));
    return uniqueResponsibilities.size;
  };

  const currentEntry = selectedEntry 
    ? entries.find(e => e.id === selectedEntry.id) || null 
    : null;

  if (isLoading) {
    return (
      <div className="journal-card p-5 md:p-8 text-center">
        <div className="w-6 h-6 md:w-8 md:h-8 border-2 border-moss border-t-transparent rounded-full animate-spin mx-auto mb-3 md:mb-4" />
        <p className="text-warm-secondary text-xs md:text-sm">Loading entries...</p>
      </div>
    );
  }

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (recentEntries.length === 0) {
    return (
      <div className="journal-card p-6 md:p-10 text-center">
        <div className="icon-container icon-container-lg mx-auto mb-4 md:mb-5">
          <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-moss" strokeLinecap="round" />
        </div>
        <h3 className="text-warm-primary mb-1.5 md:mb-2 text-base md:text-lg" style={{ fontWeight: 500 }}>Your journal awaits</h3>
        <p className="text-warm-secondary max-w-xs mx-auto text-xs md:text-sm" style={{ lineHeight: 1.6 }}>
          Start capturing your achievements, learnings, and insights.
        </p>
      </div>
    );
  }

  // Dynamic copy for the section
  const sectionCopyOptions = [
    "Small notes today become clarity at review time.",
    "Capture moments now so progress doesn't fade later.",
    "This is where your work stops disappearing."
  ];
  const copyIndex = new Date().getDate() % sectionCopyOptions.length;

  return (
    <>
      <div className="space-y-3 md:space-y-4">
        <div className="px-1">
          <h3 className="text-warm-primary text-sm md:text-[15px]" style={{ fontWeight: 500 }}>Recent Entries</h3>
          <p className="text-warm-muted text-xs mt-1" style={{ lineHeight: 1.5 }}>
            {sectionCopyOptions[copyIndex]}
          </p>
        </div>
        <div className="space-y-3 md:space-y-4">
          {recentEntries.map((entry) => (
            <EntryCard 
              key={entry.id} 
              entry={entry} 
              onClick={() => setSelectedEntry(entry)}
              matchCount={getMatchCountForEntry(entry.id)}
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
