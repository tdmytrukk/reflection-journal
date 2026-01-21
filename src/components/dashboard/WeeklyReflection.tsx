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
    
    // Combine all summaries from the week's entries
    const allSummaries = aiReflections
      .map(r => r.summary)
      .filter(Boolean) as string[];
    
    // Combine all encouragements
    const allEncouragements = aiReflections
      .map(r => r.encouragement)
      .filter(Boolean) as string[];
    
    // Create a combined summary from all entries
    const combinedSummary = allSummaries.length > 1 
      ? allSummaries.join(' ') 
      : allSummaries[0] || null;
    
    // Use the most recent encouragement or combine if multiple
    const combinedEncouragement = allEncouragements.length > 0 
      ? allEncouragements[allEncouragements.length - 1] 
      : null;
    
    return {
      dayCount: uniqueDays,
      itemCount: totalItems,
      traits,
      weekStart: start,
      weekEnd: end,
      aiReflections,
      allStrengths,
      combinedSummary,
      combinedEncouragement,
      entryCount: weekEntries.length,
    };
  }, [entries]);
  
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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="icon-container">
            <Sparkles className="w-5 h-5 text-moss" strokeLinecap="round" />
          </div>
          <h3 className="text-warm-primary" style={{ fontSize: '18px', fontWeight: 500 }}>This Week's Growth</h3>
        </div>
        <span className="text-warm-muted" style={{ fontSize: '13px' }}>{formatDateRange()}</span>
      </div>
      
      {/* AI Summary - combined from all entries */}
      {weeklyData.combinedSummary && (
        <div className="sidebar-inner-card mb-5">
          <p className="text-warm-body" style={{ fontSize: '14px', lineHeight: 1.7 }}>
            {weeklyData.combinedSummary}
          </p>
          {weeklyData.combinedEncouragement && (
            <p className="text-moss mt-3" style={{ fontSize: '13px', fontWeight: 500 }}>
              {weeklyData.combinedEncouragement}
            </p>
          )}
        </div>
      )}
      
      {/* Stats with large numbers */}
      <div className="flex items-stretch mb-5">
        <div className="metric-stat flex-1">
          <p className="number">{weeklyData.dayCount}</p>
          <p className="label">{weeklyData.dayCount === 1 ? 'day captured' : 'days captured'}</p>
        </div>
        <div className="metric-divider" />
        <div className="metric-stat flex-1">
          <p className="number">{weeklyData.itemCount}</p>
          <p className="label">moments logged</p>
        </div>
      </div>
      
      {/* Strengths/Traits detected */}
      {displayTraits.length > 0 && (
        <div>
          <p className="text-warm-muted mb-3" style={{ fontSize: '13px' }}>
            {weeklyData.allStrengths.length > 0 ? 'Key strengths:' : "You've shown:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {displayTraits.map(trait => {
              const traitLower = trait.toLowerCase();
              const Icon = TRAIT_ICONS[traitLower] || Sparkles;
              return (
                <span key={trait} className="strength-tag">
                  <Icon className="w-3.5 h-3.5" strokeLinecap="round" />
                  {trait.charAt(0).toUpperCase() + trait.slice(1)}
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {displayTraits.length === 0 && weeklyData.itemCount > 0 && (
        <p className="text-warm-secondary" style={{ fontSize: '14px' }}>
          Add more details to your entries to see personalized growth insights! 🌱
        </p>
      )}
    </div>
  );
}
