import { useUserData } from '@/hooks/useUserData';
import { Sparkles, TrendingUp, Heart, Zap, Shield, Users, Target } from '@/components/ui/icons';
import { useMemo } from 'react';

const TRAIT_ICONS: Record<string, React.ElementType> = {
  thoughtful: Heart,
  brave: Shield,
  initiative: Zap,
  collaborative: Users,
  focused: Target,
  resilient: TrendingUp,
};

const TRAIT_COLORS: Record<string, string> = {
  thoughtful: 'bg-pink-100 text-pink-700',
  brave: 'bg-amber-100 text-amber-700',
  initiative: 'bg-blue-100 text-blue-700',
  collaborative: 'bg-violet-100 text-violet-700',
  focused: 'bg-emerald-100 text-emerald-700',
  resilient: 'bg-orange-100 text-orange-700',
};

// Simple AI analysis to detect traits from entry content
function analyzeEntryForTraits(text: string): string[] {
  const traits: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Thoughtful indicators
  if (lowerText.includes('consider') || lowerText.includes('reflect') || lowerText.includes('thought about') || lowerText.includes('careful')) {
    traits.push('thoughtful');
  }
  
  // Brave indicators
  if (lowerText.includes('challenge') || lowerText.includes('difficult') || lowerText.includes('risk') || lowerText.includes('spoke up') || lowerText.includes('pushed back')) {
    traits.push('brave');
  }
  
  // Initiative indicators
  if (lowerText.includes('started') || lowerText.includes('proposed') || lowerText.includes('initiated') || lowerText.includes('created') || lowerText.includes('built')) {
    traits.push('initiative');
  }
  
  // Collaborative indicators
  if (lowerText.includes('team') || lowerText.includes('together') || lowerText.includes('collaborated') || lowerText.includes('helped') || lowerText.includes('supported')) {
    traits.push('collaborative');
  }
  
  // Focused indicators
  if (lowerText.includes('completed') || lowerText.includes('finished') || lowerText.includes('delivered') || lowerText.includes('achieved')) {
    traits.push('focused');
  }
  
  // Resilient indicators
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

export function WeeklyReflection() {
  const { entries } = useUserData();
  
  const weeklyData = useMemo(() => {
    const { start, end } = getWeekRange(new Date());
    
    const weekEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });
    
    if (weekEntries.length === 0) return null;
    
    // Collect all text from entries
    const allText = weekEntries.flatMap(e => [
      ...e.achievements,
      ...e.learnings,
      ...e.insights,
      ...e.decisions,
    ]).join(' ');
    
    // Analyze for traits
    const traits = analyzeEntryForTraits(allText);
    
    // Count items
    const totalItems = weekEntries.reduce((sum, e) => 
      sum + e.achievements.length + e.learnings.length + e.insights.length + e.decisions.length, 0
    );
    
    return {
      entryCount: weekEntries.length,
      itemCount: totalItems,
      traits,
      weekStart: start,
      weekEnd: end,
    };
  }, [entries]);
  
  if (!weeklyData || weeklyData.itemCount === 0) {
    return (
      <div className="journal-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">This Week's Growth</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Start capturing entries to see your weekly reflection and growth insights.
        </p>
      </div>
    );
  }
  
  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${weeklyData.weekStart.toLocaleDateString('en-US', options)} - ${weeklyData.weekEnd.toLocaleDateString('en-US', options)}`;
  };
  
  return (
    <div className="journal-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">This Week's Growth</h3>
        </div>
        <span className="text-xs text-muted-foreground">{formatDateRange()}</span>
      </div>
      
      {/* Stats */}
      <div className="flex gap-4 mb-4 text-center">
        <div className="flex-1 p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-medium text-foreground">{weeklyData.entryCount}</p>
          <p className="text-xs text-muted-foreground">days captured</p>
        </div>
        <div className="flex-1 p-3 rounded-lg bg-muted/50">
          <p className="text-2xl font-medium text-foreground">{weeklyData.itemCount}</p>
          <p className="text-xs text-muted-foreground">moments logged</p>
        </div>
      </div>
      
      {/* Traits detected */}
      {weeklyData.traits.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">You've shown:</p>
          <div className="flex flex-wrap gap-2">
            {weeklyData.traits.map(trait => {
              const Icon = TRAIT_ICONS[trait] || Sparkles;
              const colorClass = TRAIT_COLORS[trait] || 'bg-sage-light text-primary';
              return (
                <span
                  key={trait}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${colorClass}`}
                >
                  <Icon className="w-3 h-3" />
                  {trait.charAt(0).toUpperCase() + trait.slice(1)}
                </span>
              );
            })}
          </div>
        </div>
      )}
      
      {weeklyData.traits.length === 0 && weeklyData.itemCount > 0 && (
        <p className="text-sm text-muted-foreground">
          Add more details to your entries to see personalized growth insights! 🌱
        </p>
      )}
    </div>
  );
}