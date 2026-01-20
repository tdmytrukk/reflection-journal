import { BookOpen, CalendarCheck, FileText, CalendarDays } from 'lucide-react';
import type { ProfileStats } from '@/types';
import { format } from 'date-fns';

interface StatsCardProps {
  stats: ProfileStats | null;
}

export function StatsCard({ stats }: StatsCardProps) {
  if (!stats) {
    return (
      <div className="profile-card">
        <h3 className="text-lg font-medium mb-4" style={{ color: '#3D3228' }}>
          Your Journey
        </h3>
        <p className="text-muted-foreground italic text-center py-4">
          Start journaling to see your stats
        </p>
      </div>
    );
  }

  const statItems = [
    {
      icon: BookOpen,
      value: stats.totalEntries,
      label: 'reflections captured',
    },
    {
      icon: CalendarCheck,
      value: stats.activeWeeks,
      label: 'active weeks',
    },
    {
      icon: FileText,
      value: stats.reviewsGenerated,
      label: 'reviews generated',
    },
    {
      icon: CalendarDays,
      value: stats.daysSinceFirst,
      label: stats.firstEntryDate 
        ? `since ${format(stats.firstEntryDate, 'MMM d')}` 
        : 'days tracked',
    },
  ];

  return (
    <div className="profile-card">
      <h3 className="text-lg font-medium mb-4" style={{ color: '#3D3228' }}>
        Your Journey
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-4">
            <div 
              className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
              style={{ background: 'rgba(107, 122, 90, 0.1)' }}
            >
              <item.icon className="w-5 h-5" style={{ color: '#6B7A5A' }} />
            </div>
            <div className="metric-stat p-0">
              <div className="number">{item.value}</div>
              <div className="label">{item.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
