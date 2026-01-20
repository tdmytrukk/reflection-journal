import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import type { Goal, UserPreferences, ProfileStats, JobDescription } from '@/types';

export function useProfileData() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; email: string; avatarUrl?: string } | null>(null);
  const [currentJob, setCurrentJob] = useState<JobDescription | null>(null);
  const [roleHistory, setRoleHistory] = useState<JobDescription[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile({ 
        name: data.name, 
        email: data.email,
        avatarUrl: data.avatar_url || undefined
      });
    }
  }, [user]);

  const fetchJobDescriptions = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (data && data.length > 0) {
      // Current job is the first one (most recent start date without end date, or just most recent)
      const current = data.find(d => !d.end_date) || data[0];
      const history = data.filter(d => d.id !== current.id);
      
      setCurrentJob({
        id: current.id,
        userId: current.user_id,
        title: current.title,
        company: current.company,
        content: current.content,
        responsibilities: current.responsibilities || [],
        startDate: new Date(current.start_date),
        endDate: current.end_date ? new Date(current.end_date) : undefined,
        createdAt: new Date(current.created_at),
      });
      
      setRoleHistory(history.map(h => ({
        id: h.id,
        userId: h.user_id,
        title: h.title,
        company: h.company,
        content: h.content,
        responsibilities: h.responsibilities || [],
        startDate: new Date(h.start_date),
        endDate: h.end_date ? new Date(h.end_date) : undefined,
        createdAt: new Date(h.created_at),
      })));
    }
  }, [user]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setGoals(data.map(g => ({
        id: g.id,
        userId: g.user_id,
        text: g.text,
        targetDate: g.target_date ? new Date(g.target_date) : undefined,
        category: g.category as Goal['category'],
        status: g.status as Goal['status'],
        createdAt: new Date(g.created_at),
        updatedAt: new Date(g.updated_at),
      })));
    }
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setPreferences({
        id: data.id,
        userId: data.user_id,
        weeklyReminder: data.weekly_reminder,
        reminderDay: data.reminder_day || 'monday',
        reminderTime: data.reminder_time || '09:00',
        aiPromptsEnabled: data.ai_prompts_enabled,
        shareableRecap: data.shareable_recap,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } else {
      // Create default preferences
      setPreferences({
        id: '',
        userId: user.id,
        weeklyReminder: false,
        reminderDay: 'monday',
        reminderTime: '09:00',
        aiPromptsEnabled: true,
        shareableRecap: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    const { data: entries } = await supabase
      .from('entries')
      .select('date, created_at')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (entries && entries.length > 0) {
      const firstEntry = new Date(entries[0].date);
      const now = new Date();
      const daysSince = Math.floor((now.getTime() - firstEntry.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate active weeks (weeks with at least one entry)
      const weeks = new Set<string>();
      entries.forEach(e => {
        const d = new Date(e.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        weeks.add(weekStart.toISOString().split('T')[0]);
      });
      
      setStats({
        totalEntries: entries.length,
        activeWeeks: weeks.size,
        reviewsGenerated: 0, // Would need a reviews table
        daysSinceFirst: daysSince,
        firstEntryDate: firstEntry,
      });
    } else {
      setStats({
        totalEntries: 0,
        activeWeeks: 0,
        reviewsGenerated: 0,
        daysSinceFirst: 0,
      });
    }
  }, [user]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchJobDescriptions(),
      fetchGoals(),
      fetchPreferences(),
      fetchStats(),
    ]);
    setIsLoading(false);
  }, [fetchProfile, fetchJobDescriptions, fetchGoals, fetchPreferences, fetchStats]);

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setProfile(null);
      setCurrentJob(null);
      setRoleHistory([]);
      setGoals([]);
      setPreferences(null);
      setStats(null);
      setIsLoading(false);
    }
  }, [user, refreshData]);

  // Mutations
  const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);
    
    if (!error) {
      await fetchProfile();
    }
    
    return { error };
  };

  const updateCurrentJob = async (updates: Partial<JobDescription>) => {
    if (!user || !currentJob) return { error: new Error('Not authenticated or no current job') };
    
    const updateData: Record<string, unknown> = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.company) updateData.company = updates.company;
    if (updates.content) updateData.content = updates.content;
    if (updates.responsibilities) updateData.responsibilities = updates.responsibilities;
    if (updates.startDate) updateData.start_date = updates.startDate.toISOString();
    
    const { error } = await supabase
      .from('job_descriptions')
      .update(updateData)
      .eq('id', currentJob.id);
    
    if (!error) {
      await fetchJobDescriptions();
    }
    
    return { error };
  };

  const addRole = async (role: Omit<JobDescription, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('job_descriptions')
      .insert({
        user_id: user.id,
        title: role.title,
        company: role.company,
        content: role.content,
        responsibilities: role.responsibilities,
        start_date: role.startDate.toISOString(),
        end_date: role.endDate?.toISOString(),
      });
    
    if (!error) {
      await fetchJobDescriptions();
    }
    
    return { error };
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        text: goal.text,
        target_date: goal.targetDate?.toISOString().split('T')[0],
        category: goal.category,
        status: goal.status,
      });
    
    if (!error) {
      await fetchGoals();
    }
    
    return { error };
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const updateData: Record<string, unknown> = {};
    if (updates.text) updateData.text = updates.text;
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate?.toISOString().split('T')[0] || null;
    if (updates.category) updateData.category = updates.category;
    if (updates.status) updateData.status = updates.status;
    
    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      await fetchGoals();
    }
    
    return { error };
  };

  const deleteGoal = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (!error) {
      await fetchGoals();
    }
    
    return { error };
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const updateData: Record<string, unknown> = {};
    if (updates.weeklyReminder !== undefined) updateData.weekly_reminder = updates.weeklyReminder;
    if (updates.reminderDay) updateData.reminder_day = updates.reminderDay;
    if (updates.reminderTime) updateData.reminder_time = updates.reminderTime;
    if (updates.aiPromptsEnabled !== undefined) updateData.ai_prompts_enabled = updates.aiPromptsEnabled;
    if (updates.shareableRecap !== undefined) updateData.shareable_recap = updates.shareableRecap;
    
    // Upsert - insert if not exists, update if exists
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...updateData,
      }, {
        onConflict: 'user_id',
      });
    
    if (!error) {
      await fetchPreferences();
    }
    
    return { error };
  };

  return {
    profile,
    currentJob,
    roleHistory,
    goals,
    preferences,
    stats,
    isLoading,
    updateProfile,
    updateCurrentJob,
    addRole,
    addGoal,
    updateGoal,
    deleteGoal,
    updatePreferences,
    refreshData,
  };
}
