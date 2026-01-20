import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MinusCircle, TrendingUp } from 'lucide-react';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function ResponsibilitiesSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { responsibilities, getResponsibilityCoverage, isLoading } = useResponsibilities();

  if (isLoading || responsibilities.length === 0) {
    return null;
  }

  const coverage = getResponsibilityCoverage();
  const coveredCount = coverage.filter(c => c.coverage !== 'none').length;
  const coveragePercent = Math.round((coveredCount / responsibilities.length) * 100);

  const getCoverageIcon = (level: string) => {
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
          
          {coverage.map((item) => (
            <div
              key={item.index}
              className="flex items-start gap-3 p-3 rounded-lg bg-warm-paper/50"
            >
              {getCoverageIcon(item.coverage)}
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: '#4A4036' }}>
                  {item.text}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {getCoverageBadge(item.coverage)}
                  {item.matchCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {item.matchCount} {item.matchCount === 1 ? 'match' : 'matches'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}