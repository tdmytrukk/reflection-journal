import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MinusCircle, TrendingUp, FileText } from 'lucide-react';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface EntryPreview {
  id: string;
  date: string;
  achievements: string[];
  learnings: string[];
  insights: string[];
  decisions: string[];
}

function MatchedEntriesPopover({ 
  entryIds, 
  responsibilityIndex,
  matches 
}: { 
  entryIds: string[]; 
  responsibilityIndex: number;
  matches: any[];
}) {
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEntries = async () => {
      if (entryIds.length === 0) return;
      setIsLoading(true);
      
      const { data } = await supabase
        .from('entries')
        .select('id, date, achievements, learnings, insights, decisions')
        .in('id', entryIds);
      
      if (data) {
        setEntries(data);
      }
      setIsLoading(false);
    };

    fetchEntries();
  }, [entryIds]);

  // Get matched items for this responsibility
  const getMatchedItems = (entryId: string) => {
    const match = matches.find(m => m.entryId === entryId && m.responsibilityIndex === responsibilityIndex);
    return match?.matchedItems || [];
  };

  return (
    <PopoverContent className="w-80 p-0" align="start">
      <div className="p-3 border-b border-warm-line">
        <p className="text-xs font-medium text-muted-foreground">
          {entryIds.length} linked {entryIds.length === 1 ? 'entry' : 'entries'}
        </p>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No entries found</div>
        ) : (
          entries.map((entry) => {
            const matchedItems = getMatchedItems(entry.id);
            return (
              <div key={entry.id} className="p-3 border-b border-warm-line last:border-0">
                <p className="text-xs text-muted-foreground mb-1">
                  {format(new Date(entry.date), 'MMM d, yyyy')}
                </p>
                {matchedItems.length > 0 ? (
                  <div className="space-y-1">
                    {matchedItems.map((item: { category: string; text: string }, idx: number) => (
                      <p key={idx} className="text-sm" style={{ color: '#4A4036' }}>
                        {item.text}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: '#4A4036' }}>
                    {entry.achievements?.[0] || entry.learnings?.[0] || entry.insights?.[0] || 'Entry content'}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </PopoverContent>
  );
}

export function ResponsibilitiesSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { responsibilities, matches, getResponsibilityCoverage, isLoading } = useResponsibilities();

  if (isLoading || responsibilities.length === 0) {
    return null;
  }

  const coverage = getResponsibilityCoverage();
  const coveredCount = coverage.filter(c => c.coverage !== 'none').length;
  const coveragePercent = Math.round((coveredCount / responsibilities.length) * 100);

  const getCoverageIcon = (level: string, matchCount: number) => {
    if (matchCount > 0) {
      return <CheckCircle2 className="w-4 h-4 text-moss" />;
    }
    switch (level) {
      case 'strong':
        return <CheckCircle2 className="w-4 h-4 text-moss" />;
      case 'moderate':
        return <TrendingUp className="w-4 h-4 text-cedar" />;
      case 'weak':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <MinusCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getCoverageBadge = (level: string) => {
    switch (level) {
      case 'strong':
        return <Badge variant="outline" className="text-xs border-moss text-moss">Strong</Badge>;
      case 'moderate':
        return <Badge variant="outline" className="text-xs border-cedar text-cedar">Moderate</Badge>;
      case 'weak':
        return <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">Weak</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">No evidence</Badge>;
    }
  };

  // Get unique entry IDs for a responsibility
  const getMatchedEntryIds = (responsibilityIndex: number) => {
    const respMatches = matches.filter(m => m.responsibilityIndex === responsibilityIndex);
    return [...new Set(respMatches.map(m => m.entryId))];
  };

  return (
    <div className="mt-6 border-t border-warm-line pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: '#4A4036' }}>
            Responsibilities Tracking
          </span>
          <span className="text-xs text-muted-foreground">
            {coveredCount}/{responsibilities.length} with evidence
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24">
            <Progress value={coveragePercent} className="h-1.5" />
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            Your journal entries are matched to your job responsibilities to help track progress.
          </p>
          
          {coverage.map((item) => {
            const matchedEntryIds = getMatchedEntryIds(item.index);
            
            return (
              <div
                key={item.index}
                className="flex items-start gap-3 p-3 rounded-lg bg-warm-paper/50"
              >
                {getCoverageIcon(item.coverage, item.matchCount)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: '#4A4036' }}>
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getCoverageBadge(item.coverage)}
                    {matchedEntryIds.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center gap-1 text-xs text-moss hover:underline">
                            <FileText className="w-3 h-3" />
                            {matchedEntryIds.length} {matchedEntryIds.length === 1 ? 'entry' : 'entries'}
                          </button>
                        </PopoverTrigger>
                        <MatchedEntriesPopover 
                          entryIds={matchedEntryIds} 
                          responsibilityIndex={item.index}
                          matches={matches}
                        />
                      </Popover>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}