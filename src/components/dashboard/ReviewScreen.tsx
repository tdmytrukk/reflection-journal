import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMonthlyReview } from '@/hooks/useMonthlyReview';
import { toast } from 'sonner';
import type { Entry, MonthlyReviewAchievement } from '@/types';

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

// Shorten text to signal-level language
function toSignal(text: string): string {
  return text
    // Remove emotional qualifiers
    .replace(/\b(very|really|quite|extremely|absolutely|definitely|incredibly|particularly|especially)\s+/gi, '')
    // Remove filler phrases
    .replace(/\b(a|an)\s+(difficult|steady|calm|clear)\s+(and\s+)?/gi, '')
    .replace(/\bwith\s+great\s+/gi, 'with ')
    .replace(/\bin\s+a\s+(clear|calm|thoughtful)\s+(and\s+\w+\s+)?manner\b/gi, '')
    // Trim length - aim for ~60-80 chars max
    .trim();
}

// Group achievements by category
function groupAchievements(achievements: MonthlyReviewAchievement[]) {
  const newItems = achievements.filter(a => a.isNew);
  const reinforced = achievements.filter(a => !a.isNew && a.impact !== 'high');
  const impact = achievements.filter(a => !a.isNew && a.impact === 'high');
  
  return { newItems, reinforced, impact };
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
  const grouped = reviewData ? groupAchievements(reviewData.achievements) : null;

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header row: Timeframe selector + actions */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
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
          
          {/* Actions moved to top-right */}
          {reviewData && (
            <div className="flex items-center gap-1">
              <button
                onClick={generateReview}
                disabled={isGenerating}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                title="Regenerate"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
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
          <div className="space-y-10">
            {/* Generate button if no AI review yet */}
            {!reviewData && (
              <div className="flex justify-center">
                <button
                  onClick={generateReview}
                  disabled={isGenerating || !canGenerate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  {isGenerating ? 'Generating...' : 'Generate insights'}
                </button>
              </div>
            )}
            
            {/* Main summary section - wrapped in visual container */}
            {reviewData && grouped && (
              <>
                <section className="bg-accent/40 rounded-2xl p-6 border border-border/30">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-5">
                    {getTimeframeLabel(timeframe)}'s growth
                  </h2>
                  
                  <div className="space-y-5">
                    {/* New items grouped */}
                    {grouped.newItems.length > 0 && (
                      <div>
                        <span className="text-primary/90 text-xs font-medium uppercase tracking-wide">
                          New {grouped.newItems.length > 1 ? `(${grouped.newItems.length})` : ''}
                        </span>
                        <ul className="mt-2 space-y-2">
                          {grouped.newItems.slice(0, 3).map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary/60 mt-1">•</span>
                              <span className="text-foreground/90 text-sm leading-relaxed">
                                {toSignal(achievement.text)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Reinforced items grouped */}
                    {grouped.reinforced.length > 0 && (
                      <div>
                        <span className="text-foreground/60 text-xs font-medium uppercase tracking-wide">
                          Reinforced {grouped.reinforced.length > 1 ? `(${grouped.reinforced.length})` : ''}
                        </span>
                        <ul className="mt-2 space-y-2">
                          {grouped.reinforced.slice(0, 3).map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-1">•</span>
                              <span className="text-foreground/80 text-sm leading-relaxed">
                                {toSignal(achievement.text)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Impact items grouped */}
                    {grouped.impact.length > 0 && (
                      <div>
                        <span className="text-foreground/70 text-xs font-medium uppercase tracking-wide">
                          Impact {grouped.impact.length > 1 ? `(${grouped.impact.length})` : ''}
                        </span>
                        <ul className="mt-2 space-y-2">
                          {grouped.impact.slice(0, 2).map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground mt-1">•</span>
                              <span className="text-foreground/85 text-sm leading-relaxed">
                                {toSignal(achievement.text)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
                
                {/* Divider */}
                <div className="h-px bg-border/40" />
                
                {/* Patterns section - visually demoted */}
                {reviewData.growth.length > 0 && (
                  <section>
                    <h2 className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-3">
                      Patterns noticed
                    </h2>
                    <div className="space-y-1.5 pl-1">
                      {reviewData.growth.slice(0, 3).map((pattern, index) => (
                        <p key={index} className="text-foreground/60 text-sm leading-relaxed">
                          – {toSignal(pattern)}
                        </p>
                      ))}
                    </div>
                  </section>
                )}
                
                {/* Divider */}
                <div className="h-px bg-border/40" />
                
                {/* Strengths - lighter, smaller, max 3 */}
                {reviewData.strengths.length > 0 && (
                  <section>
                    <h2 className="text-xs text-muted-foreground/70 uppercase tracking-wide mb-3">
                      Strengths emerging
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewData.strengths.slice(0, 3).map((strength) => (
                        <span
                          key={strength}
                          className="px-2.5 py-1 text-xs bg-accent/60 text-accent-foreground/80 rounded-full"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
            
            {/* Outputs section - collapsed by default */}
            {reviewData && (
              <Collapsible open={outputsOpen} onOpenChange={setOutputsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-full py-3 border-t border-border/40">
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
                    className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-border/40 hover:bg-accent/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">Resume-ready bullets</p>
                      <p className="text-xs text-muted-foreground">Export achievements in resume format</p>
                    </div>
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-lg border border-border/40 hover:bg-accent/50 transition-colors"
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
            <div className="pt-4 border-t border-border/40">
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
              <div className="flex flex-wrap gap-1.5">
                {localStats.strengths.slice(0, 3).map((strength) => (
                  <span
                    key={strength}
                    className="px-2.5 py-1 text-xs bg-accent/60 text-accent-foreground/80 rounded-full"
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
