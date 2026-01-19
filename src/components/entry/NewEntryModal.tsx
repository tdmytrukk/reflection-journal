import { useState, useRef, useEffect } from 'react';
import { X, Mic, Sparkles, ArrowRight } from '@/components/ui/icons';
import { useApp } from '@/context/AppContext';
import type { Entry } from '@/types';

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  "What did you accomplish today?",
  "Share a win, learning, or insight...",
  "What's something you're proud of?",
  "Describe a challenge you overcame...",
];

export function NewEntryModal({ isOpen, onClose }: NewEntryModalProps) {
  const { addEntry } = useApp();
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<string[]>([]);
  const [showReflection, setShowReflection] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDER_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    // Include current input if there's content
    const allEntries = input.trim() 
      ? [...entries, input.trim()] 
      : entries;

    if (allEntries.length === 0) return;
    
    setIsSaving(true);
    
    const entry: Entry = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      date: today,
      achievements: allEntries, // For now, store all as achievements - can categorize with AI later
      learnings: [],
      insights: [],
      decisions: [],
      createdAt: today,
      updatedAt: today,
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addEntry(entry);
    setIsSaving(false);
    
    // Reset form
    setInput('');
    setEntries([]);
    onClose();
  };
  
  const usePrompt = () => {
    setInput(REFLECTION_PROMPTS[currentPromptIndex]);
    setShowReflection(false);
    textareaRef.current?.focus();
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

        {/* Reflection prompt */}
        {showReflection && (
          <div className="mb-3 p-4 rounded-xl bg-sage-light/80 backdrop-blur border border-sage-light shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-foreground mb-3">
                  {REFLECTION_PROMPTS[currentPromptIndex]}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={usePrompt}
                    className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Use this prompt
                  </button>
                  <button
                    onClick={nextPrompt}
                    className="text-xs text-primary hover:text-primary/80 transition-colors px-2"
                  >
                    Try another →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowReflection(false)}
                className="p-1 rounded hover:bg-sage-light transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
        
        {/* Main input card */}
        <div className="journal-card shadow-lg">
          {/* Date header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{formattedDate}</p>
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
            <div className="flex gap-1">
              <button
                onClick={() => setShowReflection(!showReflection)}
                className={`p-2 rounded-lg transition-colors ${showReflection ? 'bg-sage-light text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                title="Help me reflect"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button 
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors opacity-50 cursor-not-allowed" 
                disabled
                title="Voice input (coming soon)"
              >
                <Mic className="w-4 h-4" />
              </button>
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
