import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Mic, Sparkles, ArrowRight, Loader2, CalendarIcon, ChevronDown, Check, CornerDownLeft } from '@/components/ui/icons';
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

// Contextual follow-up prompts based on detected content patterns
const CONTEXTUAL_PROMPTS: { pattern: RegExp; prompts: string[] }[] = [
  {
    pattern: /\b(met|achieved|hit|reached|exceeded)\s+(goal|target|milestone|quota)/i,
    prompts: [
      "What was the specific goal you achieved?",
      "What helped you reach this goal?",
    ],
  },
  {
    pattern: /\b(decided|chose|picked|made the call|went with)\b/i,
    prompts: [
      "What made this decision difficult at the time?",
      "What alternatives did you consider?",
    ],
  },
  {
    pattern: /\b(worried|uncertain|unsure|nervous|anxious|hesitant)\b/i,
    prompts: [
      "What did you think might not work at the start?",
      "What were you most uncertain about?",
    ],
  },
  {
    pattern: /\b(worked|went well|succeeded|success|won|nailed)\b/i,
    prompts: [
      "What signal told you this was working?",
      "What specifically made this successful?",
    ],
  },
  {
    pattern: /\b(failed|didn't work|struggled|difficult|hard|challenging)\b/i,
    prompts: [
      "What made this particularly difficult?",
      "What would you try differently next time?",
    ],
  },
  {
    pattern: /\b(learned|realized|discovered|noticed|understood)\b/i,
    prompts: [
      "What surprised you about this?",
      "How will this change what you do next?",
    ],
  },
  {
    pattern: /\b(feedback|review|critique|input)\b/i,
    prompts: [
      "What was the most useful part of the feedback?",
      "What will you do with this feedback?",
    ],
  },
  {
    pattern: /\b(meeting|conversation|discussion|talked|spoke)\b/i,
    prompts: [
      "What was the key takeaway from this conversation?",
      "What came up that you didn't expect?",
    ],
  },
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

type ModalStep = 'writing' | 'followup';

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
  
  // Two-step flow state
  const [modalStep, setModalStep] = useState<ModalStep>('writing');
  const [savedEntries, setSavedEntries] = useState<string[]>([]);
  const [followUpContext, setFollowUpContext] = useState('');
  const [selectedFollowUpPrompt, setSelectedFollowUpPrompt] = useState<string | null>(null);
  const [dismissedFollowUp, setDismissedFollowUp] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followUpTextareaRef = useRef<HTMLTextAreaElement>(null);
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
      
      if (modalStep === 'writing') {
        setInput(prev => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + correctedText;
        });
      } else {
        setFollowUpContext(prev => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + correctedText;
        });
      }
    };

    if (!isListening && pendingTranscriptRef.current) {
      applyGrammarCorrection();
    }
  }, [isListening, correctGrammar, modalStep]);

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

  // Auto-resize follow-up textarea
  useEffect(() => {
    if (followUpTextareaRef.current) {
      followUpTextareaRef.current.style.height = 'auto';
      followUpTextareaRef.current.style.height = `${Math.min(followUpTextareaRef.current.scrollHeight, 150)}px`;
    }
  }, [followUpContext]);

  // Focus textarea, reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date());
      setPlaceholderIndex(Math.floor(Math.random() * PLACEHOLDER_PROMPTS.length));
      setModalStep('writing');
      setSavedEntries([]);
      setFollowUpContext('');
      setSelectedFollowUpPrompt(null);
      setDismissedFollowUp(false);
      setInput('');
      setEntries([]);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isOpen]);

  // Focus follow-up textarea when a prompt is selected
  useEffect(() => {
    if (selectedFollowUpPrompt && followUpTextareaRef.current) {
      followUpTextareaRef.current.focus();
    }
  }, [selectedFollowUpPrompt]);

  // Detect contextual follow-up prompts based on saved content
  const contextualPrompts = useMemo(() => {
    const allText = savedEntries.join(' ');
    if (allText.length < 15) return [];
    
    const matchedPrompts: string[] = [];
    for (const { pattern, prompts } of CONTEXTUAL_PROMPTS) {
      if (pattern.test(allText)) {
        // Pick one random prompt from this category
        matchedPrompts.push(prompts[Math.floor(Math.random() * prompts.length)]);
      }
    }
    return matchedPrompts.slice(0, 2); // Max 2 prompts
  }, [savedEntries]);

  // Handle first save (moves to follow-up step)
  const handleInitialSave = () => {
    const allEntries = input.trim() 
      ? [...entries, input.trim()] 
      : entries;

    if (allEntries.length === 0) return;
    
    setSavedEntries(allEntries);
    setEntries([]);
    setInput('');
    
    // Check if there are contextual prompts to show
    const allText = allEntries.join(' ');
    const hasPrompts = CONTEXTUAL_PROMPTS.some(({ pattern }) => pattern.test(allText));
    
    if (hasPrompts) {
      setModalStep('followup');
    } else {
      // No contextual prompts, save immediately
      performFinalSave(allEntries, '');
    }
  };

  // Perform final save to database
  const performFinalSave = async (entriesToSave: string[], additionalContext: string) => {
    if (!user) {
      toast.error('You must be logged in to save entries');
      return;
    }
    
    setIsSaving(true);
    
    // Merge entries with additional context if provided
    let finalEntries = [...entriesToSave];
    if (additionalContext.trim()) {
      finalEntries.push(additionalContext.trim());
    }
    
    const entryData = {
      achievements: finalEntries,
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
          onEntrySaved?.();
        });
      }
    }
    
    setIsSaving(false);
    onEntrySaved?.();
    
    // Reset and close
    setInput('');
    setEntries([]);
    setSavedEntries([]);
    setFollowUpContext('');
    setModalStep('writing');
    onClose();
  };

  // Handle final save with context
  const handleFinalSaveWithContext = () => {
    performFinalSave(savedEntries, followUpContext);
  };

  // Skip follow-up and save without additional context
  const handleSkipFollowUp = () => {
    performFinalSave(savedEntries, '');
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

      onEntrySaved?.();
      toast.success('AI reflection generated! ✨');
    } catch (error) {
      console.error('Reflection generation error:', error);
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

  const nextPrompt = () => {
    setCurrentPromptIndex(prev => (prev + 1) % REFLECTION_PROMPTS.length);
  };

  const handleSelectFollowUpPrompt = (prompt: string) => {
    setSelectedFollowUpPrompt(prompt);
  };
  
  if (!isOpen) return null;

  // Follow-up step UI
  if (modalStep === 'followup') {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-ink/20 backdrop-blur-sm"
          onClick={() => handleSkipFollowUp()}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-2xl animate-slide-up">
          {/* Original entry preview */}
          <div className="mb-3 p-4 rounded-xl bg-card/95 backdrop-blur border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Your entry</span>
            </div>
            <div className="space-y-1">
              {savedEntries.map((entry, index) => (
                <p key={index} className="text-sm text-foreground leading-relaxed">{entry}</p>
              ))}
            </div>
          </div>

          {/* Follow-up section */}
          <div className="journal-card shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
              <button
                onClick={handleSkipFollowUp}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {!selectedFollowUpPrompt && !dismissedFollowUp && contextualPrompts.length > 0 && (
              <div className="animate-fade-in">
                <p className="text-sm text-muted-foreground mb-3">
                  Want to add more context? This can help surface clearer insights later.
                </p>
                <div className="space-y-2 mb-4">
                  {contextualPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectFollowUpPrompt(prompt)}
                      className="w-full text-left px-4 py-3 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm text-foreground transition-colors border border-transparent hover:border-border"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedFollowUpPrompt && (
              <div className="animate-fade-in">
                <div className="flex items-start gap-2 mb-3">
                  <CornerDownLeft className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground font-medium">{selectedFollowUpPrompt}</p>
                </div>
                
                {/* Input with inline actions - matches initial entry layout */}
                <div className="flex items-end gap-2 bg-muted/30 border border-border rounded-lg px-4 py-3 focus-within:border-primary/50 transition-colors">
                  <textarea
                    ref={followUpTextareaRef}
                    value={followUpContext}
                    onChange={(e) => setFollowUpContext(e.target.value)}
                    placeholder="Add your response..."
                    className="flex-1 resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-sm leading-relaxed min-h-[60px] max-h-[150px]"
                    rows={2}
                  />
                  
                  {/* Inline action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                    {/* Voice input */}
                    {isSpeechSupported ? (
                      isListening ? (
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/10 animate-fade-in">
                          <Mic className="w-4 h-4 text-primary" />
                          <div className="flex items-center gap-0.5 h-4">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-primary rounded-full animate-pulse"
                                style={{
                                  height: `${Math.random() * 10 + 4}px`,
                                  animationDelay: `${i * 0.1}s`,
                                  animationDuration: `${0.4 + Math.random() * 0.3}s`,
                                }}
                              />
                            ))}
                          </div>
                          <button
                            onClick={stopListening}
                            className="p-2 rounded-lg hover:bg-moss/20 transition-colors text-moss"
                            title="Save recording"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              stopListening();
                              pendingTranscriptRef.current = '';
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
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
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border my-4" />

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleSkipFollowUp}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleFinalSaveWithContext}
                disabled={isSaving}
                className="btn-serene text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Entry'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Writing step UI (default)
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

          {/* Command line input with inline actions */}
          <div className="flex items-end gap-2">
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
              className="flex-1 resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 text-base leading-relaxed min-h-[24px] max-h-[200px]"
              rows={1}
            />
            
            {/* Inline action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              {/* Voice input */}
              {isSpeechSupported ? (
                isListening ? (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-primary/10 animate-fade-in">
                    <Mic className="w-4 h-4 text-primary" />
                    <div className="flex items-center gap-0.5 h-4">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 10 + 4}px`,
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: `${0.4 + Math.random() * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={stopListening}
                      className="p-2 rounded-lg hover:bg-moss/20 transition-colors text-moss"
                      title="Save recording"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        stopListening();
                        pendingTranscriptRef.current = '';
                      }}
                      className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
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
              ) : null}
              
              {/* Submit button - Return icon in sage green */}
              <button
                onClick={handleInitialSave}
                disabled={isSaving || (entries.length === 0 && !input.trim())}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Save entry"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CornerDownLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
