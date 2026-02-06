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

function formatEntryDay(date: Date): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yest';
  return format(d, 'EEE');
}

function getSignalPreview(entry: Entry): string {
  const allItems = [
    ...entry.achievements,
    ...entry.learnings,
    ...entry.insights,
    ...entry.decisions,
  ];
  const first = allItems[0] || '';
  // Create neutral, factual signal - max ~50 chars
  const cleaned = first
    .replace(/^I\s+/i, '') // Remove leading "I"
    .replace(/^(was|am|have been)\s+/i, '') // Remove common starters
    .trim();
  
  // Capitalize first letter
  const signal = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return signal.length > 50 ? signal.slice(0, 50) + '…' : signal;
}

// Small sparkle/dot icon component
function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 16 16" 
      fill="currentColor" 
      className={`w-3 h-3 ${className}`}
    >
      <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
    </svg>
  );
}

// Progress indicator dots
function ProgressDots({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < filled
                ? 'bg-primary'
                : 'border border-border bg-transparent'
            }`}
          />
        ))}
      </div>
      <span className="text-muted-foreground/50 text-[11px]">This week</span>
    </div>
  );
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
  const progressFilled = Math.min(entriesThisWeek, 3);
  
  const currentEntry = selectedEntry 
    ? entries.find(e => e.id === selectedEntry.id) || null 
    : null;

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      {/* Hero prompt section */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full">
          {/* Prompt as visual object */}
          <button
            onClick={() => setIsNewEntryOpen(true)}
            className="w-full text-left group"
          >
            <div className="bg-accent/40 rounded-2xl p-8 transition-all duration-300 group-hover:bg-accent/60 group-hover:shadow-sm">
              {/* Sparkle icon */}
              <SparkleIcon className="text-primary/50 mb-4" />
              
              {/* Prompt text */}
              <p className="text-xl sm:text-2xl text-foreground font-light leading-relaxed tracking-tight">
                {currentPrompt}
              </p>
              
              {/* CTA */}
              <div className="mt-6 flex items-center gap-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                <span className="text-sm">Start reflecting</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Recent reflections with timeline */}
      <div className="border-t border-border/30">
        <div className="max-w-lg mx-auto px-6 py-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : recentEntries.length > 0 ? (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-[3px] top-2 bottom-2 w-px bg-border/50" />
              
              {/* Entry rows */}
              <div className="space-y-0">
                {recentEntries.map((entry, index) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="w-full flex items-center gap-4 py-3 text-left hover:bg-accent/30 -mx-3 px-3 rounded-lg transition-colors group relative"
                  >
                    {/* Timeline dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors flex-shrink-0 relative z-10" />
                    
                    {/* Day label */}
                    <span className="text-muted-foreground text-xs w-10 flex-shrink-0 font-medium">
                      {formatEntryDay(entry.date)}
                    </span>
                    
                    {/* Signal preview */}
                    <span className="text-foreground/70 text-sm truncate flex-1 group-hover:text-foreground transition-colors">
                      {getSignalPreview(entry)}
                    </span>
                    
                    {/* Hover chevron */}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-1.5 h-1.5 rounded-full bg-border mx-auto mb-3" />
              <p className="text-muted-foreground/60 text-sm">
                No reflections yet
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="border-t border-border/30 py-6">
        <div className="max-w-lg mx-auto px-6 flex justify-center">
          <ProgressDots filled={progressFilled} total={3} />
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
