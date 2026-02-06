import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { NewEntryModal } from '@/components/entry/NewEntryModal';
import { EntryDetailSheet } from '@/components/entry/EntryDetailSheet';
import type { Entry } from '@/types';

const reflectionPrompts = [
  "What did you work on this week?",
  "What moved forward, even if it felt small?",
  "What decision wasn't straightforward?",
  "What are you proud of from this week?",
  "What was harder than expected?",
  "What did you handle for the first time?",
];

interface ReflectScreenProps {
  entries: Entry[];
  isLoading: boolean;
  onEntrySaved: () => void;
  onUpdateEntry?: (id: string, updates: Partial<Entry>) => Promise<{ error?: Error } | undefined>;
  onDeleteEntry?: (id: string) => Promise<{ error?: Error } | undefined>;
}

function formatEntryDate(date: Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE');
}

function getEntryPreview(entry: Entry): string {
  const allItems = [
    ...entry.achievements,
    ...entry.learnings,
    ...entry.insights,
    ...entry.decisions,
  ];
  const first = allItems[0] || '';
  // Truncate to ~60 chars
  return first.length > 60 ? first.slice(0, 60) + '...' : first;
}

export function ReflectScreen({ 
  entries, 
  isLoading, 
  onEntrySaved,
  onUpdateEntry,
  onDeleteEntry 
}: ReflectScreenProps) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  
  // Rotating prompt based on day
  const promptIndex = new Date().getDate() % reflectionPrompts.length;
  const currentPrompt = reflectionPrompts[promptIndex];
  
  // Recent entries sorted by date
  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);
  
  // Count entries this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const entriesThisWeek = entries.filter(e => new Date(e.date) >= startOfWeek).length;
  const needsMore = Math.max(0, 3 - entriesThisWeek);
  
  const currentEntry = selectedEntry 
    ? entries.find(e => e.id === selectedEntry.id) || null 
    : null;

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col">
      {/* Hero prompt - primary focus */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-xl w-full">
          <button
            onClick={() => setIsNewEntryOpen(true)}
            className="w-full text-left group"
          >
            <p className="text-2xl sm:text-3xl md:text-4xl text-foreground font-light leading-snug tracking-tight group-hover:text-primary/80 transition-colors cursor-text">
              {currentPrompt}
            </p>
            <div className="mt-6 flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <span className="text-sm">Start reflecting</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
      
      {/* Recent reflections - lightweight list */}
      <div className="border-t border-border/50 bg-card/30">
        <div className="max-w-xl mx-auto px-6 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="space-y-1">
              {recentEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className="w-full flex items-center gap-3 py-2.5 px-1 text-left hover:bg-accent/50 rounded-lg transition-colors group"
                >
                  <span className="text-muted-foreground text-sm w-16 flex-shrink-0">
                    {formatEntryDate(entry.date)}
                  </span>
                  <span className="text-foreground/80 text-sm truncate flex-1">
                    {getEntryPreview(entry)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No reflections yet. Start with the prompt above.
            </p>
          )}
          
          {/* Progress nudge - subtle */}
          {entriesThisWeek > 0 && needsMore > 0 && (
            <p className="text-muted-foreground/60 text-xs text-center mt-6">
              {entriesThisWeek} reflection{entriesThisWeek !== 1 ? 's' : ''} this week · {needsMore} more to unlock insights
            </p>
          )}
          {entriesThisWeek >= 3 && (
            <p className="text-primary/60 text-xs text-center mt-6">
              ✓ {entriesThisWeek} reflections this week
            </p>
          )}
        </div>
      </div>
      
      {/* New Entry Modal */}
      <NewEntryModal 
        isOpen={isNewEntryOpen} 
        onClose={() => setIsNewEntryOpen(false)}
        onEntrySaved={onEntrySaved}
      />
      
      {/* Entry Detail Sheet */}
      <EntryDetailSheet
        entry={currentEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onUpdate={onUpdateEntry}
        onDelete={onDeleteEntry}
      />
    </div>
  );
}
