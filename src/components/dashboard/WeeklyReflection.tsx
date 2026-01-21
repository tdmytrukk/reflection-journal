import { Sparkles, TrendingUp, Heart, Zap, Shield, Users, Target } from '@/components/ui/icons';
import { useMemo } from 'react';
import type { Entry } from '@/types';
import type { RecapPeriod } from '@/types';

const TRAIT_ICONS: Record<string, React.ElementType> = {
  thoughtful: Heart,
  brave: Shield,
  initiative: Zap,
  collaborative: Users,
  focused: Target,
  resilient: TrendingUp,
};

// Simple AI analysis to detect traits from entry content
function analyzeEntryForTraits(text: string): string[] {
  const traits: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('consider') || lowerText.includes('reflect') || lowerText.includes('thought about') || lowerText.includes('careful')) {
    traits.push('thoughtful');
  }
  if (lowerText.includes('challenge') || lowerText.includes('difficult') || lowerText.includes('risk') || lowerText.includes('spoke up') || lowerText.includes('pushed back')) {
    traits.push('brave');
  }
  if (lowerText.includes('started') || lowerText.includes('proposed') || lowerText.includes('initiated') || lowerText.includes('created') || lowerText.includes('built')) {
    traits.push('initiative');
  }
  if (lowerText.includes('team') || lowerText.includes('together') || lowerText.includes('collaborated') || lowerText.includes('helped') || lowerText.includes('supported')) {
    traits.push('collaborative');
  }
  if (lowerText.includes('completed') || lowerText.includes('finished') || lowerText.includes('delivered') || lowerText.includes('achieved')) {
    traits.push('focused');
  }
  if (lowerText.includes('overcame') || lowerText.includes('despite') || lowerText.includes('persisted') || lowerText.includes('adapted')) {
    traits.push('resilient');
  }
  
  return [...new Set(traits)];
}

function getWeekRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

interface RecapReflectionProps {
  entries: Entry[];
  period?: RecapPeriod;
}

export function WeeklyReflection({ entries, period = 'monthly' }: RecapReflectionProps) {
  
  const recapData = useMemo(() => {
    const { start, end } = period === 'weekly' ? getWeekRange(new Date()) : getMonthRange(new Date());
    
    const periodEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
    
    if (periodEntries.length === 0) return null;
    
    const allText = periodEntries.flatMap(e => [
      ...e.achievements,
      ...e.learnings,
      ...e.insights,
      ...e.decisions,
    ]).join(' ');
    
    const traits = analyzeEntryForTraits(allText);
    
    const totalItems = periodEntries.reduce((sum, e) => 
      sum + e.achievements.length + e.learnings.length + e.insights.length + e.decisions.length, 0
    );
    
    // Count unique days (not entries) - multiple entries on same day = 1 day
    const uniqueDays = new Set(
      periodEntries.map(e => new Date(e.date).toDateString())
    ).size;
    
    const aiReflections = periodEntries
      .filter(e => e.aiReflection)
      .map(e => e.aiReflection!);
    
    const allStrengths = [...new Set(aiReflections.flatMap(r => r.strengths || []))];
    
    // Collect all individual summaries from the period's entries
    const allSummaries = aiReflections
      .map(r => r.summary)
      .filter(Boolean) as string[];
    
    // Use the most recent encouragement
    const latestEncouragement = aiReflections
      .map(r => r.encouragement)
      .filter(Boolean)
      .pop() || null;
    
    return {
      dayCount: uniqueDays,
      itemCount: totalItems,
      traits,
      periodStart: start,
      periodEnd: end,
      aiReflections,
      allStrengths,
      allSummaries,
      latestEncouragement,
      entryCount: periodEntries.length,
    };
  }, [entries, period]);

  // Get contextual emoji based on summary content
  const getContextualEmoji = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('present') || lower.includes('meeting') || lower.includes('spoke')) return '🎤';
    if (lower.includes('team') || lower.includes('collaborat') || lower.includes('together')) return '🤝';
    if (lower.includes('learn') || lower.includes('discover') || lower.includes('realized')) return '💡';
    if (lower.includes('complet') || lower.includes('finish') || lower.includes('deliver') || lower.includes('shipped')) return '✅';
    if (lower.includes('challenge') || lower.includes('difficult') || lower.includes('overcame')) return '💪';
    if (lower.includes('creat') || lower.includes('built') || lower.includes('design')) return '🎨';
    if (lower.includes('decision') || lower.includes('chose') || lower.includes('decided')) return '🎯';
    if (lower.includes('improv') || lower.includes('better') || lower.includes('optimiz')) return '📈';
    if (lower.includes('help') || lower.includes('support') || lower.includes('mentor')) return '🌟';
    if (lower.includes('feedback') || lower.includes('review')) return '💬';
    if (lower.includes('plan') || lower.includes('strateg')) return '📋';
    if (lower.includes('launch') || lower.includes('release')) return '🚀';
    return '✨';
  };

  const periodLabel = period === 'weekly' ? "This Week's Growth" : "This Month's Review";
  const emptyMessage = period === 'weekly' 
    ? "Start capturing entries to see your weekly reflection and growth insights."
    : "Start capturing entries to see your monthly review and growth insights.";
  
  if (!recapData || recapData.itemCount === 0) {
    return (
      <div className="sidebar-card !p-4 md:!p-5 lg:!p-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="icon-container !w-8 !h-8 md:!w-10 md:!h-10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary text-base md:text-lg" style={{ fontWeight: 500 }}>{periodLabel}</h3>
        </div>
        <p className="text-warm-secondary text-xs md:text-sm" style={{ lineHeight: 1.6 }}>
          {emptyMessage}
        </p>
      </div>
    );
  }
  
  const formatDateRange = () => {
    if (period === 'weekly') {
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
      return `${recapData.periodStart.toLocaleDateString('en-US', options)} - ${recapData.periodEnd.toLocaleDateString('en-US', options)}`;
    } else {
      const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
      return recapData.periodStart.toLocaleDateString('en-US', options);
    }
  };

  const displayTraits = recapData.allStrengths.length > 0 
    ? recapData.allStrengths.slice(0, 4)
    : recapData.traits;
  
  return (
    <div className="sidebar-card !p-4 md:!p-5 lg:!p-6">
      <div className="flex items-center justify-between mb-1.5 md:mb-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="icon-container !w-8 !h-8 md:!w-10 md:!h-10">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary text-base md:text-lg" style={{ fontWeight: 500 }}>{periodLabel}</h3>
        </div>
        <span className="text-warm-muted text-xs md:text-[13px]">{formatDateRange()}</span>
      </div>
      
      {/* Encouragement - directly under headline */}
      {recapData.latestEncouragement && (
        <p className="text-moss mb-3 md:mb-5 px-1 text-xs md:text-[13px]" style={{ fontWeight: 500, lineHeight: 1.5 }}>
          {recapData.latestEncouragement}
        </p>
      )}
      
      {/* AI Summaries - each as separate talking point with emoji */}
      {recapData.allSummaries.length > 0 && (
        <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
          {recapData.allSummaries.slice(0, 3).map((summary, index) => (
            <div key={index} className="sidebar-inner-card !p-3 md:!p-4 lg:!p-5 flex gap-2 md:gap-3">
              <span className="text-base md:text-lg flex-shrink-0">{getContextualEmoji(summary)}</span>
              <p className="text-warm-body text-xs md:text-sm" style={{ lineHeight: 1.6 }}>
                {summary}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Two-column layout: Strengths on left, Stats on right */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-[rgba(139,111,71,0.08)]">
        {/* Left column - Key strengths */}
        <div>
          {displayTraits.length > 0 && (
            <>
              <p className="text-warm-muted mb-1.5 md:mb-2 text-[11px] md:text-xs">
                Key strengths
              </p>
              <div className="flex flex-wrap gap-1 md:gap-1.5">
                {displayTraits.slice(0, 3).map(trait => {
                  const traitLower = trait.toLowerCase();
                  const Icon = TRAIT_ICONS[traitLower] || Sparkles;
                  return (
                    <span key={trait} className="strength-tag !text-[10px] md:!text-xs !py-0.5 md:!py-1 !px-1.5 md:!px-2">
                      <Icon className="w-2.5 h-2.5 md:w-3 md:h-3" strokeLinecap="round" />
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                    </span>
                  );
                })}
              </div>
            </>
          )}
          {displayTraits.length === 0 && recapData.itemCount > 0 && (
            <p className="text-warm-muted text-[11px] md:text-xs">
              Add details to see strengths
            </p>
          )}
        </div>
        
        {/* Right column - Stats */}
        <div className="text-right">
          <div className="mb-1.5 md:mb-2">
            <p className="text-warm-primary text-lg md:text-xl lg:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
              {recapData.dayCount}
            </p>
            <p className="text-warm-muted text-[10px] md:text-xs">
              {recapData.dayCount === 1 ? 'day captured' : 'days captured'}
            </p>
          </div>
          <div>
            <p className="text-warm-primary text-lg md:text-xl lg:text-2xl" style={{ fontWeight: 500, lineHeight: 1 }}>
              {recapData.itemCount}
            </p>
            <p className="text-warm-muted text-[10px] md:text-xs">
              moments logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}