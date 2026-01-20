import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useResponsibilities } from '@/hooks/useResponsibilities';

export function QuarterlyCheckinBanner() {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const { currentCheckin, getCurrentQuarter, isLoading } = useResponsibilities();

  // Check if we should show the banner (end of quarter)
  const { quarter, year } = getCurrentQuarter();
  const now = new Date();
  const endOfQuarter = new Date(year, quarter * 3, 0); // Last day of quarter
  const daysUntilEnd = Math.ceil((endOfQuarter.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Show banner in last 14 days of quarter or if there's a pending checkin
  const shouldShow = !isDismissed && !isLoading && (
    (daysUntilEnd <= 14 && daysUntilEnd >= 0) ||
    (currentCheckin && currentCheckin.status === 'pending' && currentCheckin.flaggedResponsibilities.length > 0)
  );

  if (!shouldShow) {
    return null;
  }

  const quarterName = `Q${quarter} ${year}`;
  const isPending = currentCheckin?.status === 'pending';

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-moss/10 to-cedar/10 border border-moss/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-moss/20">
            <Sparkles className="w-5 h-5 text-moss" />
          </div>
          <div>
            <h3 className="font-medium" style={{ color: '#3D3228' }}>
              {isPending ? 'Quarterly check-in is ready' : `${quarterName} is ending soon`}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isPending 
                ? `Take a moment to reflect on ${currentCheckin.flaggedResponsibilities.length} responsibility areas`
                : `${daysUntilEnd} days left to capture your achievements`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/quarterly-checkin')}
            className="text-moss hover:text-moss hover:bg-moss/10"
          >
            Review
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-black/5 rounded"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}