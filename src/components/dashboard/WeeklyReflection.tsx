import { Sparkles, TrendingUp, Heart, Zap, Shield, Users, Target } from '@/components/ui/icons';
import { useMemo } from 'react';
import type { Entry } from '@/types';

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

interface WeeklyReflectionProps {
  entries: Entry[];
}

export function WeeklyReflection({ entries }: WeeklyReflectionProps) {
  
  const weeklyData = useMemo(() => {
    const { start, end } = getWeekRange(new Date());
    
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
    
    if (weekEntries.length === 0) return null;
    
    const allText = weekEntries.flatMap(e => [
      ...e.achievements,
      ...e.learnings,
      ...e.insights,
      ...e.decisions,
    ]).join(' ');
    
    const traits = analyzeEntryForTraits(allText);
    
    const totalItems = weekEntries.reduce((sum, e) => 
      sum + e.achievements.length + e.learnings.length + e.insights.length + e.decisions.length, 0
    );
    
    // Count unique days (not entries) - multiple entries on same day = 1 day
    const uniqueDays = new Set(
      weekEntries.map(e => new Date(e.date).toDateString())
    ).size;
    
    const aiReflections = weekEntries
      .filter(e => e.aiReflection)
      .map(e => e.aiReflection!);
    
    const allStrengths = [...new Set(aiReflections.flatMap(r => r.strengths || []))];
    
    // Collect all individual summaries from the week's entries
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
      weekStart: start,
      weekEnd: end,
      aiReflections,
      allStrengths,
      allSummaries,
      latestEncouragement,
      entryCount: weekEntries.length,
    };
  }, [entries]);

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
  
  if (!weeklyData || weeklyData.itemCount === 0) {
    return (
      <div className="sidebar-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="icon-container">
            <Sparkles className="w-5 h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary" style={{ fontSize: '18px', fontWeight: 500 }}>This Week's Growth</h3>
        </div>
        <p className="text-warm-secondary" style={{ fontSize: '14px', lineHeight: 1.6 }}>
          Start capturing entries to see your weekly reflection and growth insights.
        </p>
      </div>
    );
  }
  
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weeklyData.weekStart.toLocaleDateString('en-US', options)} - ${weeklyData.weekEnd.toLocaleDateString('en-US', options)}`;
  };

  const displayTraits = weeklyData.allStrengths.length > 0 
    ? weeklyData.allStrengths.slice(0, 4)
    : weeklyData.traits;
  
  return (
    <div className="sidebar-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="icon-container">
            <Sparkles className="w-5 h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary" style={{ fontSize: '18px', fontWeight: 500 }}>This Week's Growth</h3>
        </div>
        <span className="text-warm-muted" style={{ fontSize: '13px' }}>{formatDateRange()}</span>
      </div>
      
      {/* Encouragement - directly under headline */}
      {weeklyData.latestEncouragement && (
        <p className="text-moss mb-5 px-1" style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.5 }}>
          {weeklyData.latestEncouragement}
        </p>
      )}
      
      {/* AI Summaries - each as separate talking point with emoji */}
      {weeklyData.allSummaries.length > 0 && (
        <div className="space-y-3 mb-4">
          {weeklyData.allSummaries.map((summary, index) => (
            <div key={index} className="sidebar-inner-card flex gap-3">
              <span className="text-lg flex-shrink-0">{getContextualEmoji(summary)}</span>
              <p className="text-warm-body" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {summary}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Two-column layout: Strengths on left, Stats on right */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(139,111,71,0.08)]">
        {/* Left column - Key strengths */}
        <div>
          {displayTraits.length > 0 && (
            <>
              <p className="text-warm-muted mb-2" style={{ fontSize: '12px' }}>
                Key strengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {displayTraits.map(trait => {
                  const traitLower = trait.toLowerCase();
                  const Icon = TRAIT_ICONS[traitLower] || Sparkles;
                  return (
                    <span key={trait} className="strength-tag text-xs py-1 px-2">
                      <Icon className="w-3 h-3" strokeLinecap="round" />
                      {trait.charAt(0).toUpperCase() + trait.slice(1)}
                    </span>
                  );
                })}
              </div>
            </>
          )}
          {displayTraits.length === 0 && weeklyData.itemCount > 0 && (
            <p className="text-warm-muted" style={{ fontSize: '12px' }}>
              Add details to see strengths
            </p>
          )}
        </div>
        
        {/* Right column - Stats */}
        <div className="text-right">
          <div className="mb-2">
            <p className="text-warm-primary" style={{ fontSize: '24px', fontWeight: 500, lineHeight: 1 }}>
              {weeklyData.dayCount}
            </p>
            <p className="text-warm-muted" style={{ fontSize: '12px' }}>
              {weeklyData.dayCount === 1 ? 'day captured' : 'days captured'}
            </p>
          </div>
          <div>
            <p className="text-warm-primary" style={{ fontSize: '24px', fontWeight: 500, lineHeight: 1 }}>
              {weeklyData.itemCount}
            </p>
            <p className="text-warm-muted" style={{ fontSize: '12px' }}>
              moments logged
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
