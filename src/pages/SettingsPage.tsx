import { Link } from 'react-router-dom';
import { ChevronLeft, Settings, Download } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { useProfileData } from '@/hooks/useProfileData';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { WEEKDAYS } from '@/types';
import type { UserPreferences } from '@/types';

export default function SettingsPage() {
  const {
    preferences,
    isLoading,
    updatePreferences,
  } = useProfileData();

  const handleToggle = async (key: keyof UserPreferences, value: boolean) => {
    const { error } = await updatePreferences({ [key]: value });
    if (error) {
      toast.error('Failed to update preference');
    } else {
      toast.success('Setting saved');
    }
  };

  const handleSelectChange = async (key: keyof UserPreferences, value: string) => {
    const { error } = await updatePreferences({ [key]: value });
    if (error) {
      toast.error('Failed to update preference');
    } else {
      toast.success('Setting saved');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen paper-texture flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-moss" />
          <p className="text-muted-foreground text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen paper-texture">
      <DashboardHeader />
      
      <main className="max-w-[800px] mx-auto px-6 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: '#8B6F47' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium" style={{ color: '#3D3228' }}>Settings</span>
        </div>

        {/* Settings Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-normal flex items-center gap-3" style={{ color: '#3D3228' }}>
            <Settings className="w-7 h-7" style={{ color: '#8B6F47' }} />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your preferences and app settings
          </p>
        </div>

        {preferences && (
          <div className="space-y-6">
            {/* Reminders Section */}
            <div className="profile-card">
              <h3 className="text-lg font-medium mb-6" style={{ color: '#3D3228' }}>
                Reminders & Notifications
              </h3>
              
              <div className="space-y-6">
                {/* Weekly Reminder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weekly-reminder" className="cursor-pointer text-base">
                        Remind me to reflect
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get a gentle nudge to capture your weekly wins
                      </p>
                    </div>
                    <Switch
                      id="weekly-reminder"
                      checked={preferences.weeklyReminder}
                      onCheckedChange={(checked) => handleToggle('weeklyReminder', checked)}
                    />
                  </div>
                  
                  {preferences.weeklyReminder && (
                    <div className="flex gap-3 pl-4 pt-2">
                      <Select
                        value={preferences.reminderDay}
                        onValueChange={(value) => handleSelectChange('reminderDay', value)}
                      >
                        <SelectTrigger className="w-[140px] input-paper">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEEKDAYS.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={preferences.reminderTime}
                        onValueChange={(value) => handleSelectChange('reminderTime', value)}
                      >
                        <SelectTrigger className="w-[100px] input-paper">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['07:00', '08:00', '09:00', '10:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="brush-divider !my-4" />

                {/* Email Reminders */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-reminders" className="cursor-pointer text-base">
                      Email reminders
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receive reminder emails
                    </p>
                  </div>
                  <Switch
                    id="email-reminders"
                    checked={preferences.emailRemindersEnabled}
                    onCheckedChange={(checked) => handleToggle('emailRemindersEnabled', checked)}
                  />
                </div>
              </div>
            </div>

            {/* AI & Features Section */}
            <div className="profile-card">
              <h3 className="text-lg font-medium mb-6" style={{ color: '#3D3228' }}>
                AI & Features
              </h3>
              
              <div className="space-y-6">
                {/* Recap Period */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">
                      Recap period
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose weekly or monthly recap view on your dashboard
                    </p>
                  </div>
                  <Select
                    value={preferences.recapPeriod}
                    onValueChange={(value) => handleSelectChange('recapPeriod', value)}
                  >
                    <SelectTrigger className="w-[130px] input-paper">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="brush-divider !my-4" />

                {/* AI Prompts */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-prompts" className="cursor-pointer text-base">
                      Include AI prompts when stuck
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get helpful suggestions when you need inspiration
                    </p>
                  </div>
                  <Switch
                    id="ai-prompts"
                    checked={preferences.aiPromptsEnabled}
                    onCheckedChange={(checked) => handleToggle('aiPromptsEnabled', checked)}
                  />
                </div>

                <div className="brush-divider !my-4" />

                {/* Quarterly Check-in */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="quarterly-checkin" className="cursor-pointer text-base">
                      Quarterly responsibility check-in
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review your coverage of key responsibilities each quarter
                    </p>
                  </div>
                  <Switch
                    id="quarterly-checkin"
                    checked={preferences.quarterlyCheckinEnabled}
                    onCheckedChange={(checked) => handleToggle('quarterlyCheckinEnabled', checked)}
                  />
                </div>

                <div className="brush-divider !my-4" />

                {/* Monthly Pulse */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="monthly-pulse" className="cursor-pointer text-base">
                      Monthly pulse
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get a monthly coverage summary of your activities
                    </p>
                  </div>
                  <Switch
                    id="monthly-pulse"
                    checked={preferences.monthlyPulseEnabled}
                    onCheckedChange={(checked) => handleToggle('monthlyPulseEnabled', checked)}
                  />
                </div>
              </div>
            </div>

            {/* Privacy & Data Section */}
            <div className="profile-card">
              <h3 className="text-lg font-medium mb-6" style={{ color: '#3D3228' }}>
                Privacy & Data
              </h3>
              
              <div className="space-y-6">
                {/* Shareable Recap */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="shareable-recap" className="cursor-pointer text-base">
                      Make year-end recap shareable
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Allow others to view your annual summary
                    </p>
                  </div>
                  <Switch
                    id="shareable-recap"
                    checked={preferences.shareableRecap}
                    onCheckedChange={(checked) => handleToggle('shareableRecap', checked)}
                  />
                </div>

                <div className="brush-divider !my-4" />

                {/* Export Data */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-base">Export your data</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download all your entries and reflections
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Entries
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export as PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
