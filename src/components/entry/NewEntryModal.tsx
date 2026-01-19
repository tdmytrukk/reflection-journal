import { useState } from 'react';
import { X, Mic, HelpCircle, Check, Sparkles } from '@/components/ui/icons';
import { useApp } from '@/context/AppContext';
import { ENTRY_CATEGORIES } from '@/types';
import type { Entry, EntryCategory } from '@/types';

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

export function NewEntryModal({ isOpen, onClose }: NewEntryModalProps) {
  const { addEntry } = useApp();
  const [formData, setFormData] = useState<Record<EntryCategory, string[]>>({
    achievements: [''],
    learnings: [''],
    insights: [''],
    decisions: [''],
  });
  const [showReflection, setShowReflection] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const handleInputChange = (category: EntryCategory, index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev[category]];
      updated[index] = value;
      
      // Add new input if typing in last field
      if (index === updated.length - 1 && value && updated.length < 5) {
        updated.push('');
      }
      
      return { ...prev, [category]: updated };
    });
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    const entry: Entry = {
      id: crypto.randomUUID(),
      userId: 'user-1',
      date: today,
      achievements: formData.achievements.filter(a => a.trim()),
      learnings: formData.learnings.filter(l => l.trim()),
      insights: formData.insights.filter(i => i.trim()),
      decisions: formData.decisions.filter(d => d.trim()),
      createdAt: today,
      updatedAt: today,
    };
    
    // Check if there's any content
    const hasContent = entry.achievements.length > 0 || 
                       entry.learnings.length > 0 || 
                       entry.insights.length > 0 || 
                       entry.decisions.length > 0;
    
    if (!hasContent) {
      setIsSaving(false);
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addEntry(entry);
    setIsSaving(false);
    
    // Reset form
    setFormData({
      achievements: [''],
      learnings: [''],
      insights: [''],
      decisions: [''],
    });
    
    onClose();
  };
  
  const nextPrompt = () => {
    setCurrentPromptIndex(prev => 
      (prev + 1) % REFLECTION_PROMPTS.length
    );
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl journal-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium text-foreground">New Entry</h2>
            <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Reflection prompt section */}
        {showReflection && (
          <div className="mb-6 p-4 rounded-lg bg-sage-light/50 border border-sage-light animate-fade-in">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  Reflection prompt
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {REFLECTION_PROMPTS[currentPromptIndex]}
                </p>
                <button
                  onClick={nextPrompt}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Try another question →
                </button>
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
        
        {/* Entry categories */}
        <div className="space-y-6">
          {ENTRY_CATEGORIES.map(category => (
            <div key={category.key}>
              <label className="block text-sm font-medium text-foreground mb-2">
                {category.label}
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  {category.description}
                </span>
              </label>
              <div className="space-y-2">
                {formData[category.key].map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(category.key, index, e.target.value)}
                    className="input-paper"
                    placeholder={index === 0 ? `Add ${category.label.toLowerCase()}...` : 'Add another...'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="brush-divider my-6" />
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowReflection(!showReflection)}
              className="btn-ghost gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              Help me reflect
            </button>
            <button className="btn-ghost gap-2" disabled>
              <Mic className="w-4 h-4" />
              <span className="text-xs text-muted-foreground">(Coming soon)</span>
            </button>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-serene gap-2"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
