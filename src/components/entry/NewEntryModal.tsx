import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Sparkles, ArrowRight, Loader2, CalendarIcon, ChevronDown, Check } from '@/components/ui/icons';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntrySaved?: () => void;
}

const REFLECTION_PROMPTS = [
  "What decision did you make this week that wasn't straightforward?",
  "What feedback did you receive or give?",
  "What skill did you develop or practice?",
  "What obstacle did you overcome?",
  "Who did you collaborate with and what was the outcome?",
  "What made you proud this week?",
  "What would you do differently next time?",
];

const PLACEHOLDER_PROMPTS = [
  "Moments that stayed with you.",
  "Things you noticed along the way.",
  "What felt worth remembering.",
  "A few lines is plenty.",
  "Noticing is enough.",
  "You don't need the full story.",
  "What caught your attention.",
  "Just enough to remember later.",
  "Write it the way it comes.",
  "This isn't a highlight reel.",
  "What felt different today.",
  "Even partial thoughts count.",
];

function getYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

export function NewEntryModal({ isOpen, onClose, onEntrySaved }: NewEntryModalProps) {
  const { user } = useAuth();
  const { addEntry } = useUserData();
  const { triggerMatching, responsibilities } = useResponsibilities();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCorrectingGrammar, setIsCorrectingGrammar] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(() => 
    Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingTranscriptRef = useRef<string>('');
  
  // Speech recognition
  const {
    isListening,
    transcript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();
  
  const today = new Date();
  const yesterday = getYesterday();
  
  const getDateLabel = () => {
    if (isSameDay(selectedDate, today)) return 'Today';
    if (isSameDay(selectedDate, yesterday)) return 'Yesterday';
    return format(selectedDate, 'MMM d, yyyy');
  };
  
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Correct grammar using AI
  const correctGrammar = useCallback(async (text: string): Promise<string> => {
    if (!text.trim()) return text;
    
    try {
      setIsCorrectingGrammar(true);
      const response = await supabase.functions.invoke('correct-grammar', {
        body: { text },
      });

      if (response.error) {
        console.error('Grammar correction error:', response.error);
        return text;
      }

      return response.data?.correctedText || text;
    } catch (error) {
      console.error('Grammar correction failed:', error);
      return text;
    } finally {
      setIsCorrectingGrammar(false);
    }
  }, []);

  // Accumulate transcript while listening
  useEffect(() => {
    if (transcript) {
      pendingTranscriptRef.current += (pendingTranscriptRef.current ? ' ' : '') + transcript;
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // When listening stops, apply grammar correction
  useEffect(() => {
    const applyGrammarCorrection = async () => {
      const pendingText = pendingTranscriptRef.current;
      if (!pendingText) return;
      
      pendingTranscriptRef.current = '';
      
      const correctedText = await correctGrammar(pendingText);
      
      setInput(prev => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + correctedText;
      });
    };

    if (!isListening && pendingTranscriptRef.current) {
      applyGrammarCorrection();
    }
  }, [isListening, correctGrammar]);
  // Show speech error as toast
  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus textarea, reset date, and randomize placeholder when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setPlaceholderIndex(Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length));
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isOpen]);

  // Toggle voice recording
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  const handleSubmitEntry = () => {
    if (!input.trim()) return;
    setEntries(prev => [...prev, input.trim()]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitEntry();
    }
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to save entries');
      return;
    }
    
    // Include current input if there's content
    const allEntries = input.trim() 
      ? [...entries, input.trim()] 
      : entries;

    if (allEntries.length === 0) return;
    
    setIsSaving(true);
    
    const entryData = {
      achievements: allEntries,
      learnings: [] as string[],
      insights: [] as string[],
      decisions: [] as string[],
    };
    
    const result = await addEntry({
      date: selectedDate,
      ...entryData,
    });
    
    if (result?.error) {
      toast.error('Failed to save entry');
      setIsSaving(false);
      return;
    }
    
    toast.success('Entry saved! 🌱');
    
    // Generate AI reflection and match responsibilities in the background
    if (result.entryId) {
      generateReflection(result.entryId, entryData);
      
      // Match to responsibilities if available
      if (responsibilities.length > 0) {
        triggerMatching(result.entryId).then(() => {
          // Refresh to show match indicator
          onEntrySaved?.();
        });
      }
    }
    
    setIsSaving(false);
    
    // Notify parent to refresh data
    onEntrySaved?.();
    
    // Reset form
    setInput('');
    setEntries([]);
    onClose();
  };

  const generateReflection = async (entryId: string, entryData: {
    achievements: string[];
    learnings: string[];
    insights: string[];
    decisions: string[];
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke('generate-reflection', {
        body: { entryId, entryData },
      });

      if (response.error) {
        console.error('Failed to generate reflection:', response.error);
        return;
      }

      // Refresh data to show the new reflection
      onEntrySaved?.();
      toast.success('AI reflection generated! ✨');
    } catch (error) {
      console.error('Reflection generation error:', error);
    }
  };
  

  const nextPrompt = () => {
    setCurrentPromptIndex(prev => (prev + 1) % REFLECTION_PROMPTS.length);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl animate-slide-up">
        {/* Captured entries */}
        {entries.length > 0 && (
          <div className="mb-3 space-y-2">
            {entries.map((entry, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/95 backdrop-blur border border-border shadow-sm animate-fade-in"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <p className="flex-1 text-sm text-foreground leading-relaxed">{entry}</p>
                <button
                  onClick={() => removeEntry(index)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors opacity-50 hover:opacity-100"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inspiration prompt - always visible */}
        <div className="mb-3 p-4 rounded-xl bg-sage-light/80 backdrop-blur border border-sage-light shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground mb-2">
                {REFLECTION_PROMPTS[currentPromptIndex]}
              </p>
              <button
                onClick={nextPrompt}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Try another <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main input card */}
        <div className="journal-card shadow-lg">
          {/* Date header with picker */}
          <div className="flex items-center justify-between mb-4">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                  <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b border-border space-y-1">
                  <button
                    onClick={() => { setSelectedDate(new Date()); setIsDatePickerOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      isSameDay(selectedDate, today) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => { setSelectedDate(getYesterday()); setIsDatePickerOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                      isSameDay(selectedDate, yesterday) ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    Yesterday
                  </button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { if (date) { setSelectedDate(date); setIsDatePickerOpen(false); } }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Command line input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              spellCheck="true"
              data-lpignore="true"
              data-1p-ignore="true"
              data-form-type="other"
              className="w-full resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-base leading-relaxed min-h-[24px] max-h-[200px] pr-12"
              rows={1}
            />
            
            {/* Submit button */}
            {input.trim() && (
              <button
                onClick={handleSubmitEntry}
                className="absolute right-0 bottom-0 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all animate-fade-in"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Footer actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 items-center">
              {isSpeechSupported ? (
                isListening ? (
                  /* Recording in progress - waveform UI */
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 animate-fade-in">
                    <Mic className="w-4 h-4 text-primary" />
                    {/* Animated waveform */}
                    <div className="flex items-center gap-0.5 h-4">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 12 + 6}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.4 + Math.random() * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={stopListening}
                      className="p-1 rounded-full hover:bg-moss/20 transition-colors text-moss"
                      title="Save recording"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        stopListening();
                        pendingTranscriptRef.current = '';
                      }}
                      className="p-1 rounded-full hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                      title="Cancel recording"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : isCorrectingGrammar ? (
                  <button 
                    disabled
                    className="p-2 rounded-lg bg-primary/10 text-primary"
                    title="Correcting grammar..."
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </button>
                ) : (
                  <button 
                    onClick={startListening}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title="Start voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )
              ) : (
                <button 
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-50 cursor-not-allowed" 
                  disabled
                  title="Voice input not supported in this browser"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {entries.length > 0 && `${entries.length} item${entries.length > 1 ? 's' : ''}`}
              </span>
              <button
                onClick={handleSave}
                disabled={isSaving || (entries.length === 0 && !input.trim())}
                className="btn-serene text-sm disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
          
          {/* Hint text */}
          <p className="text-xs text-muted-foreground/60 mt-3 text-center">
            Press Enter to add • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}