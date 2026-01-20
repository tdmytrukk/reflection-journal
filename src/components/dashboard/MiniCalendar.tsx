import { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import type { Entry } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MiniCalendarProps {
  entries: Entry[];
  onDateSelect?: (date: Date) => void;
}

export function MiniCalendar({ entries, onDateSelect }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  const monthEntries = entries.filter(e => {
    const date = new Date(e.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  
  const daysWithEntries = new Set(
    monthEntries.map(e => new Date(e.date).getDate())
  );
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };
  
  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEntry = daysWithEntries.has(day);
      const today = isToday(day);
      
      days.push(
        <button
          key={day}
          onClick={() => onDateSelect?.(new Date(year, month, day))}
          className={`
            h-8 w-8 rounded-lg text-sm flex flex-col items-center justify-center relative
            transition-all duration-300 hover:bg-[rgba(107,122,90,0.08)]
            ${today ? 'font-medium text-moss' : 'text-warm-body'}
          `}
        >
          {hasEntry ? (
            <span className="text-base leading-none" title="Entry captured">🌱</span>
          ) : (
            day
          )}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="sidebar-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-warm-primary" style={{ fontSize: '16px', fontWeight: 500 }}>
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-[rgba(139,111,71,0.08)] transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4 text-cedar" strokeLinecap="round" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-[rgba(139,111,71,0.08)] transition-all duration-300"
          >
            <ChevronRight className="w-4 h-4 text-cedar" strokeLinecap="round" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="h-6 flex items-center justify-center">
            <span className="text-warm-muted" style={{ fontSize: '12px' }}>{day}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}
