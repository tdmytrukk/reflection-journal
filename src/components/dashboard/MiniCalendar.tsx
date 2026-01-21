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
      days.push(<div key={`empty-${i}`} className="h-6 md:h-8 w-full" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEntry = daysWithEntries.has(day);
      const today = isToday(day);
      
      days.push(
        <button
          key={day}
          onClick={() => onDateSelect?.(new Date(year, month, day))}
          className={`
            h-6 md:h-8 w-full rounded-lg text-xs md:text-sm flex flex-col items-center justify-center relative
            transition-all duration-300 hover:bg-[rgba(107,122,90,0.08)]
            ${today ? 'font-medium text-moss' : 'text-warm-body'}
          `}
        >
          {hasEntry ? (
            <span className="text-sm md:text-base leading-none" title="Entry captured">🌱</span>
          ) : (
            day
          )}
        </button>
      );
    }
    
    return days;
  };
  
  return (
    <div className="sidebar-card !p-3 md:!p-4 lg:!p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <h3 className="text-warm-primary text-sm md:text-base" style={{ fontWeight: 500 }}>
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-0.5 md:gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 md:p-2 rounded-lg hover:bg-[rgba(139,111,71,0.08)] transition-all duration-300"
          >
            <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-cedar" strokeLinecap="round" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 md:p-2 rounded-lg hover:bg-[rgba(139,111,71,0.08)] transition-all duration-300"
          >
            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-cedar" strokeLinecap="round" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(day => (
          <div key={day} className="h-6 md:h-8 w-full flex items-center justify-center">
            <span className="text-warm-muted text-[10px] md:text-[11px]">{day}</span>
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
}
