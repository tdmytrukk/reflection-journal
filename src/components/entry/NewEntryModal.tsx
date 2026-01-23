import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Mic, Sparkles, ArrowRight, Loader2, CalendarIcon, ChevronDown, Check, CornerDownLeft, Plus, Link2, ExternalLink, Trash2 } from '@/components/ui/icons';
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
  // Launch/ship - ask for artifacts and metrics
  {
    pattern: /\b(launched|shipped|released|published|deployed|live|went live)\b/i,
    prompts: [
      "Have a link to share? (video, article, or doc)",
      "What was the target metric you were aiming for?",
      "What's one thing you'd describe about the process in a sentence?",
    ],
  },
  // Campaign/creative work
  {
    pattern: /\b(campaign|creative|ad|banner|video|content|post)\b/i,
    prompts: [
      "Have a link to the creative you can share?",
      "What metric did you beat (or aim for)?",
      "What was the brief in one sentence?",
    ],
  },
  // Goals/targets achieved
  {
    pattern: /\b(met|achieved|hit|reached|exceeded|beat|surpassed)\s*(the\s+)?(goal|target|milestone|quota|kpi|benchmark)/i,
    prompts: [
      "What was the specific target vs actual result?",
      "What process change helped you get there?",
    ],
  },
  // Successful outcomes
  {
    pattern: /\b(worked|went well|succeeded|success|successful|won|nailed|crushed)\b/i,
    prompts: [
      "Any artifact you can link to? (deck, doc, or recording)",
      "What was the measurable outcome?",
      "What signal told you this was working?",
    ],
  },
  // Results/metrics mentioned
  {
    pattern: /\b(\d+%|\d+x|percent|conversion|ctr|roas|revenue|growth|increase|decrease)\b/i,
    prompts: [
      "What was the target you were aiming for?",
      "What drove this result?",
    ],
  },
  // Decisions
  {
    pattern: /\b(decided|chose|picked|made the call|went with|pivoted)\b/i,
    prompts: [
      "What alternatives did you consider?",
      "Any doc or notes you can link for future reference?",
    ],
  },
  // Uncertainty/worry - continue that thread
  {
    pattern: /\b(worried|uncertain|unsure|nervous|anxious|hesitant|risky|risk)\b/i,
    prompts: [
      "What made you push forward despite the uncertainty?",
      "How will this change what you do next?",
    ],
  },
  // Learnings
  {
    pattern: /\b(learned|realized|discovered|noticed|understood|insight)\b/i,
    prompts: [
      "How will this change what you do next?",
      "Any resource that helped? (article, video, person)",
    ],
  },
  // Feedback
  {
    pattern: /\b(feedback|review|critique|input|approved|rejected)\b/i,
    prompts: [
      "What will you do differently based on this?",
      "Any artifacts from this review you can link?",
    ],
  },
  // Presentation/meeting
  {
    pattern: /\b(presented|presentation|deck|meeting|stakeholder|exec|leadership)\b/i,
    prompts: [
      "Have a link to the deck or recording?",
      "What was the key takeaway or decision?",
    ],
  },
  // Document/write-up
  {
    pattern: /\b(wrote|written|document|doc|brief|strategy|plan|proposal)\b/i,
    prompts: [
      "Have a link to the document?",
      "What's the one-line summary?",
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

// Represents a Q&A pair for follow-up questions
interface FollowUpQA {
  question: string;
  answer: string;
}

// Work artifact link
interface WorkArtifact {
  url: string;
  label?: string;
  type: 'video' | 'article' | 'document' | 'other';
}

// Helper to detect artifact type from URL
function detectArtifactType(url: string): WorkArtifact['type'] {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com') || lower.includes('loom.com')) {
    return 'video';
  }
  if (lower.includes('medium.com') || lower.includes('substack.com') || lower.includes('blog') || lower.includes('article')) {
    return 'article';
  }
  if (lower.includes('docs.google.com') || lower.includes('notion.') || lower.includes('drive.google.com') || lower.includes('figma.com') || lower.includes('.pdf')) {
    return 'document';
  }
  return 'other';
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
  
  // Two-step flow state
  const [modalStep, setModalStep] = useState<ModalStep>('writing');
  const [savedEntries, setSavedEntries] = useState<string[]>([]);
  const [followUpQAs, setFollowUpQAs] = useState<FollowUpQA[]>([]); // Accumulated Q&A pairs
  const [followUpContext, setFollowUpContext] = useState('');
  const [selectedFollowUpPrompt, setSelectedFollowUpPrompt] = useState<string | null>(null);
  const [usedPrompts, setUsedPrompts] = useState<string[]>([]); // Track used prompts
  const [dismissedFollowUp, setDismissedFollowUp] = useState(false);
  
  // Work artifacts state
  const [workArtifacts, setWorkArtifacts] = useState<WorkArtifact[]>([]);
  const [artifactInput, setArtifactInput] = useState('');
  const [showArtifactInput, setShowArtifactInput] = useState(false);
  
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
      setFollowUpQAs([]);
      setFollowUpContext('');
      setSelectedFollowUpPrompt(null);
      setUsedPrompts([]);
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

  // Detect contextual follow-up prompts based on saved content (excluding already used prompts)
  const contextualPrompts = useMemo(() => {
    const allText = [...savedEntries, ...followUpQAs.map(qa => qa.answer)].join(' ');
    if (allText.length < 15) return [];
    
    const matchedPrompts: string[] = [];
    for (const { pattern, prompts } of CONTEXTUAL_PROMPTS) {
      if (pattern.test(allText)) {
        // Pick prompts that haven't been used yet
        const unusedPrompts = prompts.filter(p => !usedPrompts.includes(p));
        if (unusedPrompts.length > 0) {
          matchedPrompts.push(unusedPrompts[Math.floor(Math.random() * unusedPrompts.length)]);
        }
      }
    }
    return matchedPrompts.filter(p => !usedPrompts.includes(p)).slice(0, 2); // Max 2 prompts
  }, [savedEntries, followUpQAs, usedPrompts]);

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
      performFinalSave(allEntries, [], []);
    }
  };

  // Perform final save to database
  const performFinalSave = async (entriesToSave: string[], qaPairs: FollowUpQA[], artifacts: WorkArtifact[]) => {
    if (!user) {
      toast.error('You must be logged in to save entries');
      return;
    }
    
    setIsSaving(true);
    
    // Build final entries: original entries as paragraphs, then Q&A pairs formatted
    let finalEntries = [...entriesToSave];
    
    // Add Q&A pairs as formatted content with special markers for questions
    qaPairs.forEach(qa => {
      // Format: question on its own line (will be styled differently), then answer
      finalEntries.push(`[Q] ${qa.question}`);
      finalEntries.push(qa.answer);
    });
    
    const entryData = {
      achievements: finalEntries,
      learnings: [] as string[],
      insights: [] as string[],
      decisions: [] as string[],
      workArtifacts: artifacts,
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
    setFollowUpQAs([]);
    setFollowUpContext('');
    setUsedPrompts([]);
    setWorkArtifacts([]);
    setArtifactInput('');
    setShowArtifactInput(false);
    setModalStep('writing');
    onClose();
  };

  // Add current follow-up answer and trigger another question
  const handleAddAnotherFollowUp = () => {
    if (!selectedFollowUpPrompt || !followUpContext.trim()) return;
    
    // Add current Q&A to the list
    setFollowUpQAs(prev => [...prev, {
      question: selectedFollowUpPrompt,
      answer: followUpContext.trim()
    }]);
    setUsedPrompts(prev => [...prev, selectedFollowUpPrompt]);
    
    // Reset for next question
    setFollowUpContext('');
    setSelectedFollowUpPrompt(null);
  };

  // Handle final save with all accumulated context
  const handleFinalSaveWithContext = () => {
    // If there's a current answer being typed, include it
    let allQAs = [...followUpQAs];
    if (selectedFollowUpPrompt && followUpContext.trim()) {
      allQAs.push({
        question: selectedFollowUpPrompt,
        answer: followUpContext.trim()
      });
    }
    performFinalSave(savedEntries, allQAs, workArtifacts);
  };

  // Skip follow-up and save without additional context
  const handleSkipFollowUp = () => {
    performFinalSave(savedEntries, followUpQAs, workArtifacts);
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
          {/* Original entry preview with accumulated Q&As */}
          <div className="mb-3 p-4 rounded-xl bg-card/95 backdrop-blur border border-border shadow-sm max-h-[40vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Your entry</span>
            </div>
            <div className="space-y-3">
              {/* Original entries */}
              {savedEntries.map((entry, index) => (
                <p key={`entry-${index}`} className="text-sm text-foreground leading-relaxed">{entry}</p>
              ))}
              
              {/* Accumulated Q&A pairs with pale sage styling for questions */}
              {followUpQAs.map((qa, index) => (
                <div key={`qa-${index}`} className="space-y-1.5">
                  <p className="text-sm text-primary/80 italic px-3 py-1.5 rounded-lg bg-primary/5 border-l-2 border-primary/30">
                    {qa.question}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed pl-3">{qa.answer}</p>
                </div>
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

            {/* Show prompt selection if no prompt selected and there are available prompts */}
            {!selectedFollowUpPrompt && !dismissedFollowUp && contextualPrompts.length > 0 && (
              <div className="animate-fade-in">
                <p className="text-sm text-muted-foreground mb-3">
                  {followUpQAs.length > 0 
                    ? "Want to add more context?" 
                    : "Want to add more context? This can help surface clearer insights later."}
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

            {/* Show message when no more prompts available */}
            {!selectedFollowUpPrompt && contextualPrompts.length === 0 && followUpQAs.length > 0 && (
              <div className="animate-fade-in">
                <p className="text-sm text-muted-foreground mb-4">
                  Great context added! Ready to save your entry.
                </p>
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

            {/* Work Artifacts Section */}
            <div className="mb-4">
              {/* Show added artifacts */}
              {workArtifacts.length > 0 && (
                <div className="space-y-2 mb-3">
                  {workArtifacts.map((artifact, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-sm group"
                    >
                      <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <a 
                        href={artifact.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-foreground hover:text-primary transition-colors"
                      >
                        {artifact.label || artifact.url}
                      </a>
                      <span className="text-xs text-muted-foreground capitalize">{artifact.type}</span>
                      <button
                        onClick={() => setWorkArtifacts(prev => prev.filter((_, i) => i !== index))}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add artifact input */}
              {showArtifactInput ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2 focus-within:border-primary/50 transition-colors">
                    <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      type="url"
                      value={artifactInput}
                      onChange={(e) => setArtifactInput(e.target.value)}
                      placeholder="Paste link (video, article, doc, etc.)"
                      className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground/60"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && artifactInput.trim()) {
                          const url = artifactInput.trim();
                          setWorkArtifacts(prev => [...prev, {
                            url,
                            type: detectArtifactType(url),
                          }]);
                          setArtifactInput('');
                          setShowArtifactInput(false);
                        } else if (e.key === 'Escape') {
                          setArtifactInput('');
                          setShowArtifactInput(false);
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (artifactInput.trim()) {
                        const url = artifactInput.trim();
                        setWorkArtifacts(prev => [...prev, {
                          url,
                          type: detectArtifactType(url),
                        }]);
                        setArtifactInput('');
                      }
                      setShowArtifactInput(false);
                    }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setArtifactInput('');
                      setShowArtifactInput(false);
                    }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowArtifactInput(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Add work artifact link
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-4" />

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3">
              {/* Go deeper button - only show when there's a current answer and more prompts available */}
              {selectedFollowUpPrompt && followUpContext.trim() && contextualPrompts.length > 0 && (
                <button
                  onClick={handleAddAnotherFollowUp}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <span className="text-primary">+</span>
                  Go deeper
                </button>
              )}
              
              {/* Save button */}
              <button
                onClick={handleFinalSaveWithContext}
                disabled={isSaving}
                className="btn-serene text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save'}
                <CornerDownLeft className="w-4 h-4" />
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
