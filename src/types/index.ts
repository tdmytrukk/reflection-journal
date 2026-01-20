export interface User {
  id: string;
  email: string;
  name: string;
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

export type EntryCategory = 'achievements' | 'learnings' | 'insights' | 'decisions';

export const ENTRY_CATEGORIES: { key: EntryCategory; label: string; description: string }[] = [
  { key: 'achievements', label: 'Achievements', description: 'What did you accomplish?' },
  { key: 'learnings', label: 'Learnings', description: 'What did you learn?' },
  { key: 'insights', label: 'Insights', description: 'What realizations did you have?' },
  { key: 'decisions', label: 'Decisions', description: 'What decisions did you make?' },
];
