import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { ResponsibilityMatch, QuarterlyCheckin, FlaggedResponsibility } from '@/types';

export function useResponsibilities() {
  const { user } = useAuth();
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [matches, setMatches] = useState<ResponsibilityMatch[]>([]);
  const [currentCheckin, setCurrentCheckin] = useState<QuarterlyCheckin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getCurrentQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return { quarter, year: now.getFullYear() };
  };

  const fetchResponsibilities = useCallback(async () => {
    if (!user) return;

    const { data: job } = await supabase
      .from('job_descriptions')
      .select('responsibilities')
      .eq('user_id', user.id)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (job?.responsibilities) {
      setResponsibilities(job.responsibilities);
    }
  }, [user]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('responsibility_matches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMatches(data.map(m => ({
        id: m.id,
        userId: m.user_id,
        entryId: m.entry_id,
        responsibilityIndex: m.responsibility_index,
        responsibilityText: m.responsibility_text,
        matchScore: parseFloat(String(m.match_score)),
        evidenceType: m.evidence_type as 'strong' | 'moderate' | 'weak',
        matchedItems: (m.matched_items as unknown as { category: string; text: string }[]) || [],
        createdAt: new Date(m.created_at),
      })));
    }
  }, [user]);

  const fetchCurrentCheckin = useCallback(async () => {
    if (!user) return;

    const { quarter, year } = getCurrentQuarter();

    const { data } = await supabase
      .from('quarterly_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('quarter', quarter)
      .eq('year', year)
      .maybeSingle();

    if (data) {
      setCurrentCheckin({
        id: data.id,
        userId: data.user_id,
        quarter: data.quarter,
        year: data.year,
        status: data.status as 'pending' | 'in_progress' | 'completed',
        flaggedResponsibilities: (data.flagged_responsibilities as unknown as FlaggedResponsibility[]) || [],
        focusNextQuarter: (data.focus_next_quarter as unknown as string[]) || [],
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    }
  }, [user]);

  const getResponsibilityCoverage = useCallback(() => {
    const coverage = responsibilities.map((text, index) => {
      const respMatches = matches.filter(m => m.responsibilityIndex === index);
      const totalScore = respMatches.reduce((sum, m) => sum + m.matchScore, 0);
      const avgScore = respMatches.length > 0 ? totalScore / respMatches.length : 0;
      const strongMatches = respMatches.filter(m => m.evidenceType === 'strong').length;
      const moderateMatches = respMatches.filter(m => m.evidenceType === 'moderate').length;

      return {
        index,
        text,
        matchCount: respMatches.length,
        averageScore: avgScore,
        strongMatches,
        moderateMatches,
        coverage: respMatches.length === 0 ? 'none' : avgScore >= 0.6 ? 'strong' : avgScore >= 0.4 ? 'moderate' : 'weak',
      };
    });

    return coverage.sort((a, b) => b.matchCount - a.matchCount);
  }, [responsibilities, matches]);

  const triggerMatching = async (entryId: string) => {
    if (!user) return;

    try {
      const response = await supabase.functions.invoke('match-responsibilities', {
        body: { entryId, userId: user.id },
      });

      if (response.error) {
        console.error('Error matching responsibilities:', response.error);
        return;
      }

      await fetchMatches();
    } catch (error) {
      console.error('Error triggering matching:', error);
    }
  };

  const generateQuarterlyCheckin = async () => {
    if (!user) return null;

    const { quarter, year } = getCurrentQuarter();

    try {
      const response = await supabase.functions.invoke('generate-quarterly-checkin', {
        body: { userId: user.id, quarter, year },
      });

      if (response.error) {
        console.error('Error generating checkin:', response.error);
        return null;
      }

      await fetchCurrentCheckin();
      return response.data;
    } catch (error) {
      console.error('Error generating quarterly checkin:', error);
      return null;
    }
  };

  const updateCheckinItem = async (
    index: number, 
    action: FlaggedResponsibility['action'], 
    note?: string
  ) => {
    if (!user || !currentCheckin) return { error: new Error('No checkin available') };

    const updated = currentCheckin.flaggedResponsibilities.map((item) => {
      if (item.index === index) {
        return { ...item, action, note };
      }
      return item;
    });

    const { error } = await supabase
      .from('quarterly_checkins')
      .update({
        flagged_responsibilities: JSON.parse(JSON.stringify(updated)),
        status: 'in_progress',
      })
      .eq('id', currentCheckin.id);

    if (!error) {
      await fetchCurrentCheckin();
    }

    return { error };
  };

  const completeCheckin = async (focusItems: string[]) => {
    if (!user || !currentCheckin) return { error: new Error('No checkin available') };

    const { error } = await supabase
      .from('quarterly_checkins')
      .update({
        status: 'completed',
        focus_next_quarter: focusItems,
        completed_at: new Date().toISOString(),
      })
      .eq('id', currentCheckin.id);

    if (!error) {
      await fetchCurrentCheckin();
    }

    return { error };
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setResponsibilities([]);
        setMatches([]);
        setCurrentCheckin(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      await Promise.all([
        fetchResponsibilities(),
        fetchMatches(),
        fetchCurrentCheckin(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [user, fetchResponsibilities, fetchMatches, fetchCurrentCheckin]);

  return {
    responsibilities,
    matches,
    currentCheckin,
    isLoading,
    getResponsibilityCoverage,
    triggerMatching,
    generateQuarterlyCheckin,
    updateCheckinItem,
    completeCheckin,
    getCurrentQuarter,
    refreshData: () => Promise.all([fetchResponsibilities(), fetchMatches(), fetchCurrentCheckin()]),
  };
}