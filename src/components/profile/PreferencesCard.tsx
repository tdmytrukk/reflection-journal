import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Download } from 'lucide-react';
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
import type { UserPreferences } from '@/types';
import { WEEKDAYS } from '@/types';

interface PreferencesCardProps {
  preferences: UserPreferences | null;
  isEditing: boolean;
  onUpdate: (updates: Partial<UserPreferences>) => Promise<void>;
}

export function PreferencesCard({ preferences, isEditing, onUpdate }: PreferencesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!preferences) return null;

  const handleToggle = async (key: keyof UserPreferences, value: boolean) => {
    await onUpdate({ [key]: value });
  };

  const handleSelectChange = async (key: keyof UserPreferences, value: string) => {
    await onUpdate({ [key]: value });
  };

  return (
    <div className="profile-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: '#3D3228' }}>
          <Settings className="w-5 h-5" style={{ color: '#8B6F47' }} />
          Preferences
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* Weekly Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-reminder" className="cursor-pointer">
                Remind me to reflect
              </Label>
              <Switch
                id="weekly-reminder"
                checked={preferences.weeklyReminder}
                onCheckedChange={(checked) => handleToggle('weeklyReminder', checked)}
                disabled={!isEditing}
              />
            </div>
            
            {preferences.weeklyReminder && (
              <div className="flex gap-3 pl-4">
                <Select
                  value={preferences.reminderDay}
                  onValueChange={(value) => handleSelectChange('reminderDay', value)}
                  disabled={!isEditing}
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
                  disabled={!isEditing}
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

          {/* AI Prompts */}
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-prompts" className="cursor-pointer">
              Include AI prompts when stuck
            </Label>
            <Switch
              id="ai-prompts"
              checked={preferences.aiPromptsEnabled}
              onCheckedChange={(checked) => handleToggle('aiPromptsEnabled', checked)}
              disabled={!isEditing}
            />
          </div>

          {/* Shareable Recap */}
          <div className="flex items-center justify-between">
            <Label htmlFor="shareable-recap" className="cursor-pointer">
              Make year-end recap shareable
            </Label>
            <Switch
              id="shareable-recap"
              checked={preferences.shareableRecap}
              onCheckedChange={(checked) => handleToggle('shareableRecap', checked)}
              disabled={!isEditing}
            />
          </div>

          <div className="brush-divider !my-4" />

          {/* Export Data */}
          <div className="space-y-2">
            <Label>Export your data</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Entries
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
