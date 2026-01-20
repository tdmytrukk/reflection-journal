import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Target, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { useToast } from '@/hooks/use-toast';
import type { FlaggedResponsibility } from '@/types';

export default function QuarterlyCheckinPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    currentCheckin, 
    generateQuarterlyCheckin, 
    updateCheckinItem, 
    completeCheckin,
    getCurrentQuarter,
    isLoading 
  } = useResponsibilities();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [focusItems, setFocusItems] = useState<number[]>([]);

  const { quarter, year } = getCurrentQuarter();
  const quarterName = `Q${quarter} ${year}`;

  // Generate checkin if none exists
  useEffect(() => {
    const generateIfNeeded = async () => {
      if (!isLoading && !currentCheckin) {
        setIsGenerating(true);
        await generateQuarterlyCheckin();
        setIsGenerating(false);
      }
    };
    generateIfNeeded();
  }, [isLoading, currentCheckin, generateQuarterlyCheckin]);

  // Initialize notes from existing data
  useEffect(() => {
    if (currentCheckin) {
      const existingNotes: Record<number, string> = {};
      currentCheckin.flaggedResponsibilities.forEach(item => {
        if (item.note) {
          existingNotes[item.index] = item.note;
        }
      });
      setNotes(existingNotes);
    }
  }, [currentCheckin]);

  const handleActionSelect = async (index: number, action: FlaggedResponsibility['action']) => {
    setIsSaving(true);
    await updateCheckinItem(index, action, notes[index]);
    setIsSaving(false);
  };

  const handleNoteChange = (index: number, note: string) => {
    setNotes(prev => ({ ...prev, [index]: note }));
  };

  const handleNoteBlur = async (index: number) => {
    const item = currentCheckin?.flaggedResponsibilities.find(r => r.index === index);
    if (item?.action) {
      await updateCheckinItem(index, item.action, notes[index]);
    }
  };

  const toggleFocusItem = (index: number) => {
    setFocusItems(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index].slice(0, 2)
    );
  };

  const handleComplete = async () => {
    if (!currentCheckin) return;

    setIsSaving(true);
    const focusTexts = focusItems
      .map(idx => currentCheckin.flaggedResponsibilities.find(r => r.index === idx)?.text)
      .filter(Boolean) as string[];

    const { error } = await completeCheckin(focusTexts);
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete check-in',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check-in complete',
        description: 'Your quarterly reflection has been saved',
      });
      navigate('/dashboard');
    }
  };

  if (isLoading || isGenerating) {
    return (
      <div className="min-h-screen bg-warm-base flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-moss" />
          <p className="mt-4 text-muted-foreground">Preparing your quarterly reflection...</p>
        </div>
      </div>
    );
  }

  if (!currentCheckin || currentCheckin.flaggedResponsibilities.length === 0) {
    return (
      <div className="min-h-screen bg-warm-base p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>

          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto text-moss mb-4" />
            <h1 className="text-2xl font-medium mb-2" style={{ color: '#3D3228' }}>
              All caught up!
            </h1>
            <p className="text-muted-foreground">
              Your journal entries are covering your responsibilities well this quarter.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="mt-6 btn-serene"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (currentCheckin.status === 'completed') {
    return (
      <div className="min-h-screen bg-warm-base p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>

          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto text-moss mb-4" />
            <h1 className="text-2xl font-medium mb-2" style={{ color: '#3D3228' }}>
              {quarterName} Check-in Complete
            </h1>
            <p className="text-muted-foreground mb-6">
              You've reflected on your quarterly responsibilities.
            </p>
            
            {currentCheckin.focusNextQuarter.length > 0 && (
              <div className="bg-warm-paper rounded-xl p-6 text-left max-w-md mx-auto">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-moss" />
                  Focus for next quarter
                </h3>
                <ul className="space-y-2">
                  {currentCheckin.focusNextQuarter.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-moss">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={() => navigate('/dashboard')} 
              className="mt-6 btn-serene"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const items = currentCheckin.flaggedResponsibilities;
  const currentItem = items[currentStep];
  const allItemsReviewed = items.every(item => item.action);

  return (
    <div className="min-h-screen bg-warm-base p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2" style={{ color: '#3D3228' }}>
            {quarterName} Quarterly Check-in
          </h1>
          <p className="text-muted-foreground">
            Take a moment to reflect on areas that may need attention. This is for your awareness, not judgment.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`
                h-2 flex-1 rounded-full transition-colors
                ${i === currentStep ? 'bg-moss' : i < currentStep || items[i].action ? 'bg-moss/40' : 'bg-warm-line'}
              `}
            />
          ))}
        </div>

        {/* Current item */}
        <div className="bg-warm-paper rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium" style={{ color: '#4A4036' }}>
                {currentItem.text}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {currentItem.coverage === 'none' ? 'No evidence this quarter' : 'Limited evidence this quarter'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <RadioGroup
              value={currentItem.action || ''}
              onValueChange={(value) => handleActionSelect(currentItem.index, value as FlaggedResponsibility['action'])}
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-warm-base/50 cursor-pointer">
                <RadioGroupItem value="not-in-scope" id="not-in-scope" />
                <Label htmlFor="not-in-scope" className="cursor-pointer flex-1">
                  <span className="font-medium">Not in scope this quarter</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    This wasn't a focus area for me during this period
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-warm-base/50 cursor-pointer">
                <RadioGroupItem value="not-captured" id="not-captured" />
                <Label htmlFor="not-captured" className="cursor-pointer flex-1">
                  <span className="font-medium">I did this, but didn't capture it</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    A reminder to log this type of work going forward
                  </p>
                </Label>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-warm-base/50 cursor-pointer">
                <RadioGroupItem value="needs-focus" id="needs-focus" />
                <Label htmlFor="needs-focus" className="cursor-pointer flex-1">
                  <span className="font-medium">Needs focus next quarter</span>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    I'd like to prioritize this area going forward
                  </p>
                </Label>
              </div>
            </RadioGroup>

            {/* Optional note */}
            <div className="mt-4">
              <Textarea
                placeholder="Add a note (optional)..."
                value={notes[currentItem.index] || ''}
                onChange={(e) => handleNoteChange(currentItem.index, e.target.value)}
                onBlur={() => handleNoteBlur(currentItem.index)}
                className="textarea-journal min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {currentStep < items.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="btn-serene"
              disabled={!currentItem.action}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(items.length)}
              className="btn-serene"
              disabled={!allItemsReviewed}
            >
              Review & Complete
            </Button>
          )}
        </div>

        {/* Final step - Focus selection */}
        {currentStep === items.length && (
          <div className="mt-8 bg-warm-paper rounded-xl p-6">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-moss" />
              Set focus for next quarter
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Optionally select up to 2 responsibilities to focus on (gentle reminders only)
            </p>

            <div className="space-y-2 mb-6">
              {items
                .filter(item => item.action === 'needs-focus')
                .map(item => (
                  <div 
                    key={item.index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-warm-base/50"
                  >
                    <Checkbox
                      id={`focus-${item.index}`}
                      checked={focusItems.includes(item.index)}
                      onCheckedChange={() => toggleFocusItem(item.index)}
                      disabled={!focusItems.includes(item.index) && focusItems.length >= 2}
                    />
                    <Label htmlFor={`focus-${item.index}`} className="cursor-pointer text-sm">
                      {item.text}
                    </Label>
                  </div>
                ))}
              
              {items.filter(item => item.action === 'needs-focus').length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No items marked as "needs focus" - you can still complete the check-in
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(items.length - 1)}
              >
                Back
              </Button>
              <Button
                onClick={handleComplete}
                className="btn-serene"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Complete Check-in'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}