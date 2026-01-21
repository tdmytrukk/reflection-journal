export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  jobTitle?: string;
  createdAt: Date;
}

export interface JobDescription {
  id: string;
  userId: string;
  title: string;
  company: string;
  content: string;
  responsibilities: string[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export interface EntryItem {
  text: string;
  createdAt: Date;
}

export interface AIReflection {
  summary: string;
  strengths: string[];
  highlights: string[];
  encouragement: string;
}

export interface Entry {
  id: string;
  userId: string;
  date: Date;
  achievements: string[];
  learnings: string[];
  insights: string[];
  decisions: string[];
  aiReflection?: AIReflection;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyReflection {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  traits: string[];
  summary: string;
  growthHighlights: string[];
  entryCount: number;
  createdAt: Date;
}

export interface GeneratedReview {
  id: string;
  userId: string;
  quarter: string;
  year: number;
  content: string;
  createdAt: Date;
}

export interface ResumeBullet {
  id: string;
  userId: string;
  period: string;
  bullets: string[];
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  text: string;
  targetDate?: Date;
  category: 'promotion' | 'skill' | 'leadership' | 'project' | 'custom';
  status: 'on-track' | 'needs-attention' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export type RecapPeriod = 'weekly' | 'monthly';

export interface UserPreferences {
  id: string;
  userId: string;
  weeklyReminder: boolean;
  reminderDay: string;
  reminderTime: string;
  aiPromptsEnabled: boolean;
  shareableRecap: boolean;
  quarterlyCheckinEnabled: boolean;
  monthlyPulseEnabled: boolean;
  emailRemindersEnabled: boolean;
  recapPeriod: RecapPeriod;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponsibilityMatch {
  id: string;
  userId: string;
  entryId: string;
  responsibilityIndex: number;
  responsibilityText: string;
  matchScore: number;
  evidenceType: 'strong' | 'moderate' | 'weak';
  matchedItems: { category: string; text: string }[];
  createdAt: Date;
}

export interface FlaggedResponsibility {
  index: number;
  text: string;
  coverage: 'none' | 'weak';
  matchCount: number;
  averageScore: number;
  action?: 'not-in-scope' | 'not-captured' | 'needs-focus';
  note?: string;
}

export interface QuarterlyCheckin {
  id: string;
  userId: string;
  quarter: number;
  year: number;
  status: 'pending' | 'in_progress' | 'completed';
  flaggedResponsibilities: FlaggedResponsibility[];
  focusNextQuarter: string[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileStats {
  totalEntries: number;
  activeWeeks: number;
  reviewsGenerated: number;
  daysSinceFirst: number;
  firstEntryDate?: Date;
}

export type EntryCategory = 'achievements' | 'learnings' | 'insights' | 'decisions';

export const ENTRY_CATEGORIES: { key: EntryCategory; label: string; description: string }[] = [
  { key: 'achievements', label: 'Achievements', description: 'What did you accomplish?' },
  { key: 'learnings', label: 'Learnings', description: 'What did you learn?' },
  { key: 'insights', label: 'Insights', description: 'What realizations did you have?' },
  { key: 'decisions', label: 'Decisions', description: 'What decisions did you make?' },
];

export const GOAL_CATEGORIES = [
  { value: 'promotion', label: 'Promotion' },
  { value: 'skill', label: 'Skill Development' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'project', label: 'Project Completion' },
  { value: 'custom', label: 'Custom' },
] as const;

export const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
] as const;
