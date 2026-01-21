import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MonthlyReviewData, Entry } from '@/types';
import { toast } from 'sonner';

function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function useMonthlyReview(entries: Entry[], _period: 'weekly' | 'monthly' = 'monthly') {
  const [reviewData, setReviewData] = useState<MonthlyReviewData | null>(null);
  const [isLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current period's entries
  const now = new Date();
  const { start, end } = getMonthRange(now);
  
  const periodEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= start && entryDate <= end;
  });

  const entriesCount = periodEntries.length;
  const canGenerate = entriesCount >= 3;

  // Calculate basic stats from entries (for fallback display)
  const calculateLocalStats = useCallback(() => {
    const uniqueDays = new Set(periodEntries.map(e => new Date(e.date).toDateString())).size;
    const totalItems = periodEntries.reduce((sum, e) => 
      sum + e.achievements.length + e.learnings.length + e.insights.length + e.decisions.length, 0
    );
    
    // Extract strengths from existing AI reflections
    const aiReflections = periodEntries
      .filter(e => e.aiReflection)
      .map(e => e.aiReflection!);
    
    const allStrengths = [...new Set(aiReflections.flatMap(r => r.strengths || []))];
    const allSummaries = aiReflections.map(r => r.summary).filter(Boolean) as string[];
    
    return {
      daysActive: uniqueDays,
      totalItems,
      strengths: allStrengths.slice(0, 5),
      summaries: allSummaries.slice(0, 3),
      encouragement: aiReflections.map(r => r.encouragement).filter(Boolean).pop() || null
    };
  }, [periodEntries]);

  const generateReview = useCallback(async () => {
    if (!canGenerate) {
      toast.error('Add a few more entries to generate your monthly review');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('generate-monthly-review', {
        body: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        }
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        if (data.error === 'Not enough entries') {
          setError(data.message || 'Add more entries to generate a review');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      if (data?.review) {
        setReviewData({
          summary: data.review.summary,
          achievements: data.review.achievements,
          growth: data.review.growth,
          strengths: data.review.strengths,
          stats: data.review.stats,
          generatedAt: new Date(data.review.generatedAt)
        });
        toast.success('Monthly review generated!');
      }
    } catch (err) {
      console.error('Failed to generate review:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate review';
      setError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, now]);

  return {
    reviewData,
    isLoading,
    isGenerating,
    error,
    generateReview,
    canGenerate,
    entriesCount,
    localStats: calculateLocalStats()
  };
}
