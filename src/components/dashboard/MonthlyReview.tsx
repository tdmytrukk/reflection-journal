import { Sparkles, RefreshCw, Copy } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useMonthlyReview } from '@/hooks/useMonthlyReview';
import type { Entry, MonthlyReviewAchievement } from '@/types';
import { toast } from 'sonner';

interface MonthlyReviewProps {
  entries: Entry[];
  period?: 'weekly' | 'monthly';
}

function AchievementItem({ achievement }: { achievement: MonthlyReviewAchievement }) {
  const isNew = achievement.isNew;
  const isHigh = achievement.impact === 'high';
  
  return (
    <div className={`p-3 md:p-4 rounded-xl transition-all ${
      isNew 
        ? 'bg-[rgba(107,122,90,0.08)] border border-[rgba(107,122,90,0.15)]' 
        : 'bg-[rgba(139,111,71,0.04)]'
    }`}>
      <div className="flex gap-2 md:gap-3">
        <span className="flex-shrink-0 mt-0.5 text-sm md:text-base">
          {isNew ? '⭐' : '✅'}
        </span>
        <div className="flex-1 min-w-0">
          {isNew && (
            <span className="text-moss text-[10px] md:text-xs font-medium uppercase tracking-wide mb-1 block">
              First time
            </span>
          )}
          <p className={`text-warm-body text-xs md:text-sm ${isHigh ? 'font-medium' : ''}`} style={{ lineHeight: 1.6 }}>
            {achievement.text}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MonthlyReview({ entries, period = 'monthly' }: MonthlyReviewProps) {
  const {
    reviewData, 
    isGenerating, 
    error,
    generateReview, 
    canGenerate,
    entriesCount,
    localStats
  } = useMonthlyReview(entries, period);

  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const periodLabel = period === 'weekly' ? "This Week's Growth" : "This Month's Review";

  const handleCopyToClipboard = async () => {
    if (!reviewData) return;
    
    const text = `${periodLabel} - ${monthYear}

${reviewData.summary}

Key Achievements:
${reviewData.achievements.map(a => `${a.isNew ? '⭐ FIRST TIME: ' : '✓ '}${a.text}`).join('\n')}

Growth This Month:
${reviewData.growth.map(g => `• ${g}`).join('\n')}

Key Strengths: ${reviewData.strengths.join(', ')}

Stats: ${reviewData.stats.daysActive} days captured, ${reviewData.stats.totalEntries} entries logged`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Empty state - not enough entries
  if (entriesCount < 3 && !reviewData) {
    return (
      <div className="sidebar-card !p-4 md:!p-5 lg:!p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="icon-container !w-8 !h-8 md:!w-10 md:!h-10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary text-base md:text-lg" style={{ fontWeight: 500 }}>{periodLabel}</h3>
        </div>
        <p className="text-warm-secondary text-xs md:text-sm mb-4" style={{ lineHeight: 1.6 }}>
          Not enough data yet. Add {3 - entriesCount} more {3 - entriesCount === 1 ? 'entry' : 'entries'} to generate your monthly review.
        </p>
        <div className="text-warm-muted text-[11px] md:text-xs">
          {entriesCount} of 3 entries required
        </div>
      </div>
    );
  }

  // Show local aggregation while no AI review has been generated
  if (!reviewData) {
    return (
      <div className="sidebar-card !p-4 md:!p-5 lg:!p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="icon-container !w-8 !h-8 md:!w-10 md:!h-10">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-moss" strokeLinecap="round" />
            </div>
            <h3 className="text-warm-primary text-base md:text-lg" style={{ fontWeight: 500 }}>{periodLabel}</h3>
          </div>
          <span className="text-warm-muted text-xs md:text-[13px]">{monthYear}</span>
        </div>
        
        {/* Local summaries from individual entries */}
        {localStats.summaries.length > 0 && (
          <div className="space-y-2 md:space-y-3 mb-4">
            {localStats.summaries.map((summary, index) => (
              <div key={index} className="sidebar-inner-card !p-3 md:!p-4">
                <p className="text-warm-body text-xs md:text-sm" style={{ lineHeight: 1.6 }}>
                  {summary}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {/* Generate button */}
        <Button
          onClick={generateReview}
          disabled={isGenerating || !canGenerate}
          className="w-full btn-primary mb-4"
          size="sm"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate AI Review
            </>
          )}
        </Button>
        
        {error && (
          <p className="text-red-600 text-xs mb-3">{error}</p>
        )}
        
        {/* Basic stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-[rgba(139,111,71,0.08)]">
          <div>
            {localStats.strengths.length > 0 && (
              <>
                <p className="text-warm-muted mb-1.5 md:mb-2 text-[11px] md:text-xs">Key strengths</p>
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {localStats.strengths.slice(0, 3).map(strength => (
                    <span key={strength} className="strength-tag !text-[10px] md:!text-xs !py-0.5 md:!py-1 !px-1.5 md:!px-2">
                      {strength}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="text-right">
            <div className="mb-1.5 md:mb-2">
              <p className="text-warm-primary text-lg md:text-xl lg:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
                {localStats.daysActive}
              </p>
              <p className="text-warm-muted text-[10px] md:text-xs">
                {localStats.daysActive === 1 ? 'day captured' : 'days captured'}
              </p>
            </div>
            <div>
              <p className="text-warm-primary text-lg md:text-xl lg:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
                {localStats.totalItems}
              </p>
              <p className="text-warm-muted text-[10px] md:text-xs">moments logged</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full AI-generated review
  return (
    <div className="sidebar-card !p-4 md:!p-5 lg:!p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 md:mb-1.5">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="icon-container !w-8 !h-8 md:!w-10 md:!h-10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary text-base md:text-lg" style={{ fontWeight: 500 }}>{periodLabel}</h3>
        </div>
        <button
          onClick={generateReview}
          disabled={isGenerating}
          className="p-1.5 rounded-lg hover:bg-[rgba(107,122,90,0.08)] transition-colors text-cedar hover:text-moss"
          title="Regenerate review"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Subtitle and date */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <p className="text-warm-muted text-[11px] md:text-xs">Generated from your entries this month.</p>
        <span className="text-warm-muted text-[11px] md:text-xs">{monthYear}</span>
      </div>
      
      {/* Opening insight - prominent */}
      <p className="text-warm-body text-sm md:text-base mb-4 md:mb-5" style={{ lineHeight: 1.7 }}>
        {reviewData.summary}
      </p>
      
      {/* Divider */}
      <div className="border-t border-[rgba(139,111,71,0.08)] mb-4 md:mb-5" />
      
      {/* Highlights section */}
      <div className="mb-4 md:mb-5">
        <h4 className="text-warm-primary text-xs md:text-sm font-medium mb-3">Highlights</h4>
        
        {/* New achievements first */}
        {reviewData.achievements.filter(a => a.isNew).length > 0 && (
          <div className="mb-3">
            {reviewData.achievements
              .filter(a => a.isNew)
              .map((achievement, index) => (
                <AchievementItem key={`new-${index}`} achievement={achievement} />
              ))}
          </div>
        )}
        
        {/* Standard achievements */}
        <div className="space-y-2">
          {reviewData.achievements
            .filter(a => !a.isNew)
            .map((achievement, index) => (
              <AchievementItem key={`std-${index}`} achievement={achievement} />
            ))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-[rgba(139,111,71,0.08)] mb-4 md:mb-5" />
      
      {/* Growth section */}
      {reviewData.growth.length > 0 && (
        <div className="mb-4 md:mb-5">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <span className="text-base">🌱</span>
            <h4 className="text-warm-primary text-xs md:text-sm font-medium">Growth This Month</h4>
          </div>
          <ul className="space-y-1.5">
            {reviewData.growth.map((item, index) => (
              <li key={index} className="text-warm-body text-xs md:text-sm flex items-start gap-2">
                <span className="flex-shrink-0">📈</span>
                <span style={{ lineHeight: 1.5 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Divider */}
      <div className="border-t border-[rgba(139,111,71,0.08)] mb-4 md:mb-5" />
      
      {/* Key strengths */}
      <div className="mb-4 md:mb-5">
        <p className="text-warm-muted mb-2 text-[11px] md:text-xs">Key strengths</p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {reviewData.strengths.map(strength => (
            <span key={strength} className="strength-tag !text-[10px] md:!text-xs !py-1 md:!py-1.5 !px-2 md:!px-3">
              {strength}
            </span>
          ))}
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-[rgba(139,111,71,0.08)] mb-4 md:mb-5" />
      
      {/* Stats row */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="text-center">
          <p className="text-warm-primary text-xl md:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
            {reviewData.stats.daysActive}
          </p>
          <p className="text-warm-muted text-[10px] md:text-xs">days captured</p>
        </div>
        <div className="text-center">
          <p className="text-warm-primary text-xl md:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
            {reviewData.stats.totalEntries}
          </p>
          <p className="text-warm-muted text-[10px] md:text-xs">entries</p>
        </div>
        {reviewData.stats.newAchievementTypes > 0 && (
          <div className="text-center">
            <p className="text-moss text-xl md:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
              {reviewData.stats.newAchievementTypes}
            </p>
            <p className="text-warm-muted text-[10px] md:text-xs">new firsts</p>
          </div>
        )}
      </div>
      
      {/* Action button - just copy */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToClipboard}
          className="text-xs"
        >
          <Copy className="w-3.5 h-3.5 mr-1.5" />
          Copy
        </Button>
      </div>
    </div>
  );
}
