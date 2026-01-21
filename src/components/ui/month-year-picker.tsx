import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarIcon } from '@/components/ui/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

interface MonthYearPickerProps {
  value?: string; // Format: "YYYY-MM" or empty
  onChange: (value: string) => void;
  placeholder?: string;
  maxDate?: Date;
  className?: string;
}

export function MonthYearPicker({ 
  value, 
  onChange, 
  placeholder = 'Select date',
  maxDate,
  className 
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse value or default to current year
  const currentDate = new Date();
  const [year, month] = value ? value.split('-').map(Number) : [currentDate.getFullYear(), null];
  const [viewYear, setViewYear] = useState(year);
  
  const handleSelect = (monthIndex: number) => {
    const formatted = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };
  
  const isDisabled = (monthIndex: number) => {
    if (!maxDate) return false;
    const date = new Date(viewYear, monthIndex);
    return date > maxDate;
  };
  
  const displayValue = value 
    ? `${MONTHS[parseInt(value.split('-')[1]) - 1]} ${value.split('-')[0]}`
    : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg border transition-colors",
            "bg-background hover:bg-muted/50",
            "border-warm-line focus:outline-none focus:ring-2 focus:ring-primary/20",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <span>{displayValue || placeholder}</span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <button
            type="button"
            onClick={() => setViewYear(y => y - 1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="font-medium text-foreground">{viewYear}</span>
          <button
            type="button"
            onClick={() => setViewYear(y => y + 1)}
            disabled={maxDate && viewYear >= maxDate.getFullYear()}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        
        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1 p-3 pointer-events-auto">
          {MONTHS.map((monthName, index) => {
            const isSelected = value === `${viewYear}-${String(index + 1).padStart(2, '0')}`;
            const disabled = isDisabled(index);
            
            return (
              <button
                key={monthName}
                type="button"
                onClick={() => handleSelect(index)}
                disabled={disabled}
                className={cn(
                  "py-2 px-3 text-sm rounded-lg transition-colors",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted",
                  disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                )}
              >
                {monthName}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
