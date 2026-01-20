import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { CurrentRoleCard } from '@/components/profile/CurrentRoleCard';
import { RoleHistoryCard } from '@/components/profile/RoleHistoryCard';
import { GoalsCard } from '@/components/profile/GoalsCard';
import { StatsCard } from '@/components/profile/StatsCard';
import { PreferencesCard } from '@/components/profile/PreferencesCard';
import { useProfileData } from '@/hooks/useProfileData';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
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
  } = useProfileData();

  const handleUpdateName = async (name: string) => {
    const { error } = await updateProfile({ name });
    if (error) {
      toast.error('Failed to update name');
    } else {
      toast.success('Name updated');
    }
  };

  const handleUpdateAvatar = async (url: string) => {
    const { error } = await updateProfile({ avatarUrl: url });
    if (error) {
      toast.error('Failed to update avatar');
    }
  };

  const handleUpdateJob = async (updates: Parameters<typeof updateCurrentJob>[0]) => {
    const { error } = await updateCurrentJob(updates);
    if (error) {
      toast.error('Failed to update job');
    } else {
      toast.success('Job updated');
    }
  };

  const handleAddRole = async (role: Parameters<typeof addRole>[0]) => {
    const { error } = await addRole(role);
    if (error) {
      toast.error('Failed to add role');
    } else {
      toast.success('Role added');
    }
  };

  const handleAddGoal = async (goal: Parameters<typeof addGoal>[0]) => {
    const { error } = await addGoal(goal);
    if (error) {
      toast.error('Failed to add goal');
    } else {
      toast.success('Goal added');
    }
  };

  const handleUpdateGoal = async (id: string, updates: Parameters<typeof updateGoal>[1]) => {
    const { error } = await updateGoal(id, updates);
    if (error) {
      toast.error('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const { error } = await deleteGoal(id);
    if (error) {
      toast.error('Failed to delete goal');
    } else {
      toast.success('Goal deleted');
    }
  };

  const handleUpdatePreferences = async (updates: Parameters<typeof updatePreferences>[0]) => {
    const { error } = await updatePreferences(updates);
    if (error) {
      toast.error('Failed to update preferences');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // All changes are saved inline, so just toggle off edit mode
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsEditing(false);
    setIsSaving(false);
    toast.success('Profile updated');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-moss" />
          <p className="text-muted-foreground text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture">
      <DashboardHeader />
      
      <main className="max-w-[1400px] mx-auto px-6 pt-8 pb-16">
        {/* Breadcrumb & Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: '#8B6F47' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium" style={{ color: '#3D3228' }}>Profile</span>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="btn-serene"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Profile Identity */}
          <div className="space-y-6">
            <ProfileHeader
              name={profile?.name || ''}
              email={profile?.email || ''}
              avatarUrl={profile?.avatarUrl}
              isEditing={isEditing}
              onUpdateName={handleUpdateName}
              onUpdateAvatar={handleUpdateAvatar}
            />
            
            <CurrentRoleCard
              job={currentJob}
              isEditing={isEditing}
              onUpdate={handleUpdateJob}
            />
            
            <RoleHistoryCard
              roles={roleHistory}
              isEditing={isEditing}
              onAddRole={handleAddRole}
            />
          </div>

          {/* Right Column - Goals & Insights */}
          <div className="space-y-6">
            <GoalsCard
              goals={goals}
              isEditing={isEditing}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
            
            <StatsCard stats={stats} />
            
            <PreferencesCard
              preferences={preferences}
              isEditing={isEditing}
              onUpdate={handleUpdatePreferences}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
