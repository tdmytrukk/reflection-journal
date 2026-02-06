import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMonthlyReview } from '@/hooks/useMonthlyReview';
import { toast } from 'sonner';
import type { Entry } from '@/types';

type Timeframe = 'week' | 'month' | 'quarter';

interface ReviewScreenProps {
  entries: Entry[];
}

function getTimeframeLabel(timeframe: Timeframe): string {
  switch (timeframe) {
    case 'week': return 'This week';
    case 'month': return 'This month';
    case 'quarter': return 'This quarter';
  }
}

function getEntriesForTimeframe(entries: Entry[], timeframe: Timeframe): Entry[] {
  const now = new Date();
  let start: Date;
  
  switch (timeframe) {
    case 'week':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
      break;
  }
  
  return entries.filter(e => new Date(e.date) >= start);
}

export function ReviewScreen({ entries }: ReviewScreenProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [outputsOpen, setOutputsOpen] = useState(false);
  
  const periodEntries = getEntriesForTimeframe(entries, timeframe);
  const {
    reviewData,
    isGenerating,
    generateReview,
    canGenerate,
    entriesCount,
    localStats
  } = useMonthlyReview(periodEntries, 'monthly');
  
  const handleCopyToClipboard = async () => {
    if (!reviewData) return;
    
    const text = `Growth Summary - ${getTimeframeLabel(timeframe)}

${reviewData.summary}

Key Achievements:
${reviewData.achievements.map(a => `${a.isNew ? '• New: ' : '• '}${a.text}`).join('\n')}

Growth:
${reviewData.growth.map(g => `• ${g}`).join('\n')}

Key Strengths: ${reviewData.strengths.join(', ')}`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };
  
  const handleExportResumeBullets = async () => {
    if (!reviewData) {
      toast.error('Generate a review first');
      return;
    }
    
    const bullets = reviewData.achievements
      .map(a => `• ${a.text}`)
      .join('\n');
    
    try {
      await navigator.clipboard.writeText(bullets);
      toast.success('Resume bullets copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const hasEnoughData = entriesCount >= 3;

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Timeframe selector */}
        <div className="flex items-center gap-2 mb-8">
          {(['week', 'month', 'quarter'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                timeframe === tf
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {getTimeframeLabel(tf)}
            </button>
          ))}
        </div>
        
        {/* Not enough data state */}
        {!hasEnoughData && !reviewData && (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-foreground/80 mb-2">Not enough reflections yet</p>
            <p className="text-muted-foreground text-sm">
              Add {3 - entriesCount} more {3 - entriesCount === 1 ? 'reflection' : 'reflections'} to see insights
            </p>
          </div>
        )}
        
        {/* Growth summary */}
        {(hasEnoughData || reviewData) && (
          <div className="space-y-8">
            {/* Generate button if no AI review yet */}
            {!reviewData && (
              <div className="flex justify-center">
                <Button
                  onClick={generateReview}
                  disabled={isGenerating || !canGenerate}
                  className="gap-2"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Generate insights'}
                </Button>
              </div>
            )}
            
            {/* Main summary section */}
            {reviewData && (
              <>
                <section>
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    {getTimeframeLabel(timeframe)}'s growth
                  </h2>
                  <ul className="space-y-3">
                    {reviewData.achievements.slice(0, 4).map((achievement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-primary/80 text-sm font-medium flex-shrink-0 w-20">
                          {achievement.isNew ? 'New' : achievement.impact === 'high' ? 'Impact' : 'Reinforced'}:
                        </span>
                        <span className="text-foreground/90 text-sm leading-relaxed">
                          {achievement.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                
                {/* Patterns section */}
                {reviewData.growth.length > 0 && (
                  <section>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
                      Patterns noticed
                    </h2>
                    <ul className="space-y-2">
                      {reviewData.growth.slice(0, 3).map((pattern, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          <span className="text-foreground/80 text-sm">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                
                {/* Strengths */}
                {reviewData.strengths.length > 0 && (
                  <section>
                    <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                      Key strengths
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {reviewData.strengths.map((strength) => (
                        <span
                          key={strength}
                          className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-full"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Regenerate / Copy actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateReview}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 mr-1.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </>
            )}
            
            {/* Outputs section - collapsed by default */}
            {reviewData && (
              <Collapsible open={outputsOpen} onOpenChange={setOutputsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full py-3 border-t border-border/50">
                  <span className="text-sm">Generate outputs</span>
                  {outputsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 space-y-3">
                  <button
                    onClick={handleExportResumeBullets}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">Resume-ready bullets</p>
                      <p className="text-xs text-muted-foreground">Export achievements in resume format</p>
                    </div>
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">Performance review summary</p>
                      <p className="text-xs text-muted-foreground">Copy full summary for review prep</p>
                    </div>
                  </button>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* History link */}
            <div className="pt-4 border-t border-border/50">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                View full timeline
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Local stats fallback when no AI review */}
        {hasEnoughData && !reviewData && localStats.summaries.length > 0 && (
          <div className="space-y-4 mt-8">
            <p className="text-sm text-muted-foreground">
              {entriesCount} reflections captured · {localStats.daysActive} days active
            </p>
            {localStats.strengths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {localStats.strengths.slice(0, 4).map((strength) => (
                  <span
                    key={strength}
                    className="px-3 py-1.5 text-xs bg-accent text-accent-foreground rounded-full"
                  >
                    {strength}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
