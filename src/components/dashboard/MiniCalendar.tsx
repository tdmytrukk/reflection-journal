import { useState } from 'react';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { useApp } from '@/context/AppContext';
import type { Entry } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface MiniCalendarProps {
  onDateSelect?: (date: Date) => void;
}

export function MiniCalendar({ onDateSelect }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { entries } = useApp();
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get entries for this month
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
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEntry = daysWithEntries.has(day);
      const today = isToday(day);
      
      days.push(
        <button
          key={day}
          onClick={() => onDateSelect?.(new Date(year, month, day))}
          className={`
            h-8 w-8 rounded-lg text-sm flex flex-col items-center justify-center relative
            transition-colors hover:bg-muted
            ${today ? 'font-medium text-primary' : 'text-foreground'}
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
    <div className="journal-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <div key={day} className="h-6 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">{day}</span>
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
