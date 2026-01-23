import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Entry, JobDescription, WorkArtifact } from '@/types';
import type { Json } from '@/integrations/supabase/types';

function parseDateOnlyToLocal(dateStr: string): Date {
  // DB stores `date` as YYYY-MM-DD (no timezone). `new Date(YYYY-MM-DD)` is treated as UTC
  // and can display as the previous day in negative timezones.
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function useUserData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile({ name: data.name, email: data.email, avatarUrl: data.avatar_url || undefined });
    }
  }, [user]);

  const fetchJobDescription = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setJobDescription({
        id: data.id,
        userId: data.user_id,
        title: data.title,
        company: data.company,
        content: data.content,
        responsibilities: data.responsibilities || [],
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        createdAt: new Date(data.created_at),
      });
    }
  }, [user]);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (data) {
      setEntries(data.map(e => ({
        id: e.id,
        userId: e.user_id,
        date: parseDateOnlyToLocal(e.date),
        achievements: e.achievements || [],
        learnings: e.learnings || [],
        insights: e.insights || [],
        decisions: e.decisions || [],
        workArtifacts: (e.work_artifacts as unknown as Entry['workArtifacts']) || [],
        aiReflection: e.ai_reflection as unknown as Entry['aiReflection'],
        createdAt: new Date(e.created_at),
        updatedAt: new Date(e.updated_at),
      })));
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchProfile(), fetchJobDescription(), fetchEntries()]);
    setIsLoading(false);
  }, [fetchProfile, fetchJobDescription, fetchEntries]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setProfile(null);
      setJobDescription(null);
      setEntries([]);
      setIsLoading(false);
    }
  }, [user, refreshData]);

  const saveJobDescription = async (jobDesc: Omit<JobDescription, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: user.id,
        title: jobDesc.title,
        company: jobDesc.company,
        content: jobDesc.content,
        responsibilities: jobDesc.responsibilities,
        start_date: jobDesc.startDate.toISOString(),
        end_date: jobDesc.endDate?.toISOString(),
      })
      .select()
      .single();
    
    if (data && !error) {
      await fetchJobDescription();
    }
    
    return { error };
  };

  const addEntry = async (entry: Omit<Entry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<{ error?: Error; entryId?: string }> => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const insertData = {
      user_id: user.id,
      date: `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}-${String(entry.date.getDate()).padStart(2, '0')}`,
      achievements: entry.achievements,
      learnings: entry.learnings,
      insights: entry.insights,
      decisions: entry.decisions,
      work_artifacts: (entry.workArtifacts || []) as unknown as Json,
    };
    
    const { data, error } = await supabase
      .from('entries')
      .insert([insertData])
      .select('id')
      .single();
    
    if (!error) {
      await fetchEntries();
    }
    
    return { error: error ?? undefined, entryId: data?.id };
  };

  const updateEntry = async (id: string, updates: Partial<Entry>) => {
    if (!user) return;
    
    const updateData: Record<string, unknown> = {};
    if (updates.achievements) updateData.achievements = updates.achievements;
    if (updates.learnings) updateData.learnings = updates.learnings;
    if (updates.insights) updateData.insights = updates.insights;
    if (updates.decisions) updateData.decisions = updates.decisions;
    if (updates.aiReflection) updateData.ai_reflection = updates.aiReflection;
    
    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      await fetchEntries();
    }
    
    return { error };
  };

  const deleteEntry = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      await fetchEntries();
    }
    
    return { error };
  };

  const hasCompletedOnboarding = !!jobDescription;

  return {
    profile,
    jobDescription,
    entries,
    isLoading,
    hasCompletedOnboarding,
    saveJobDescription,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshData,
  };
}