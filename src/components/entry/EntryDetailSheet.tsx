import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Target, Lightbulb, Compass, BookOpen, Sparkles, Calendar, Star, 
  Edit3, Trash2, X, Check, Plus, Loader2, Link2, ExternalLink 
} from '@/components/ui/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Entry, EntryCategory } from '@/types';

interface EntryDetailSheetProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Entry>) => Promise<{ error?: Error } | undefined>;
  onDelete?: (id: string) => Promise<{ error?: Error } | undefined>;
}

const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getCategoryDetails = (category: string) => {
  switch (category) {
    case 'achievements':
      return { Icon: Target, label: 'Achievements', color: 'text-emerald-600' };
    case 'learnings':
      return { Icon: Lightbulb, label: 'Learnings', color: 'text-amber-600' };
    case 'insights':
      return { Icon: Compass, label: 'Insights', color: 'text-blue-600' };
    case 'decisions':
      return { Icon: BookOpen, label: 'Decisions', color: 'text-purple-600' };
    default:
      return { Icon: Target, label: category, color: 'text-primary' };
  }
};

const CATEGORIES: EntryCategory[] = ['achievements', 'learnings', 'insights', 'decisions'];

export function EntryDetailSheet({ entry, isOpen, onClose, onUpdate, onDelete }: EntryDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedEntry, setEditedEntry] = useState<{
    achievements: string[];
    learnings: string[];
    insights: string[];
    decisions: string[];
  } | null>(null);
  const [newItems, setNewItems] = useState<Record<EntryCategory, string>>({
    achievements: '',
    learnings: '',
    insights: '',
    decisions: '',
  });

  if (!entry) return null;

  const handleStartEdit = () => {
    setEditedEntry({
      achievements: [...entry.achievements],
      learnings: [...entry.learnings],
      insights: [...entry.insights],
      decisions: [...entry.decisions],
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedEntry(null);
    setIsEditing(false);
    setNewItems({ achievements: '', learnings: '', insights: '', decisions: '' });
  };

  const handleSaveEdit = async () => {
    if (!editedEntry || !onUpdate) return;
    
    setIsSaving(true);
    const result = await onUpdate(entry.id, editedEntry);
    setIsSaving(false);
    
    if (!result?.error) {
      setIsEditing(false);
      setEditedEntry(null);
      setNewItems({ achievements: '', learnings: '', insights: '', decisions: '' });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    const result = await onDelete(entry.id);
    setIsDeleting(false);
    setShowDeleteDialog(false);
    
    if (!result?.error) {
      onClose();
    }
  };

  const handleRemoveItem = (category: EntryCategory, index: number) => {
    if (!editedEntry) return;
    setEditedEntry({
      ...editedEntry,
      [category]: editedEntry[category].filter((_, i) => i !== index),
    });
  };

  const handleAddItem = (category: EntryCategory) => {
    const newItem = newItems[category].trim();
    if (!newItem || !editedEntry) return;
    
    setEditedEntry({
      ...editedEntry,
      [category]: [...editedEntry[category], newItem],
    });
    setNewItems({ ...newItems, [category]: '' });
  };

  const handleKeyDown = (e: React.KeyboardEvent, category: EntryCategory) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem(category);
    }
  };

  const currentData = isEditing && editedEntry ? editedEntry : {
    achievements: entry.achievements,
    learnings: entry.learnings,
    insights: entry.insights,
    decisions: entry.decisions,
  };

  const categories = CATEGORIES
    .map(key => ({ key, items: currentData[key] }))
    .filter(cat => isEditing || cat.items.length > 0);

  const aiReflection = entry.aiReflection;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        if (!open) {
          handleCancelEdit();
          onClose();
        }
      }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col">
          <SheetHeader className="mb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{formatDate(entry.date)}</span>
            </div>
            {isEditing && (
              <SheetTitle className="text-xl font-semibold text-foreground">
                Edit Entry
              </SheetTitle>
            )}
            {!isEditing && <SheetTitle className="sr-only">Journal Entry</SheetTitle>}
          </SheetHeader>

          {/* Entry Content - Simplified View */}
          <div className="space-y-6">
            {isEditing ? (
              /* Edit Mode - Show all categories */
              <>
                {categories.map(({ key, items }) => {
                  const { Icon, label, color } = getCategoryDetails(key);
                  return (
                    <div key={key}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <h3 className="text-sm font-medium text-foreground">{label}</h3>
                      </div>
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 group">
                            <p className="flex-1 text-sm text-foreground/90 leading-relaxed p-2 bg-muted/50 rounded-lg">
                              {item}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(key, idx)}
                              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                              title="Remove item"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add new item input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItems[key]}
                            onChange={(e) => setNewItems({ ...newItems, [key]: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, key)}
                            placeholder={`Add ${label.toLowerCase().slice(0, -1)}...`}
                            className="flex-1 text-sm p-2 bg-transparent border border-dashed border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                          />
                          {newItems[key].trim() && (
                            <button
                              onClick={() => handleAddItem(key)}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show empty categories in edit mode */}
                {CATEGORIES
                  .filter(key => !categories.find(c => c.key === key))
                  .map(key => {
                    const { Icon, label, color } = getCategoryDetails(key);
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <h3 className="text-sm font-medium text-foreground">{label}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newItems[key]}
                            onChange={(e) => setNewItems({ ...newItems, [key]: e.target.value })}
                            onKeyDown={(e) => handleKeyDown(e, key)}
                            placeholder={`Add ${label.toLowerCase().slice(0, -1)}...`}
                            className="flex-1 text-sm p-2 bg-transparent border border-dashed border-border rounded-lg placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                          />
                          {newItems[key].trim() && (
                            <button
                              onClick={() => handleAddItem(key)}
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </>
            ) : (
              /* View Mode - Simplified, calm layout */
              <>
                {/* Primary Entry Content - No heading, just the user's words */}
                {(() => {
                  const allItems = [
                    ...currentData.achievements,
                    ...currentData.learnings,
                    ...currentData.insights,
                    ...currentData.decisions,
                  ].filter(item => !item.startsWith('[Q] '));
                  
                  return allItems.length > 0 && (
                    <div className="space-y-2">
                      {allItems.map((item, idx) => (
                        <p key={idx} className="text-sm text-foreground/90 leading-relaxed">
                          {item}
                        </p>
                      ))}
                    </div>
                  );
                })()}

                {/* Work Artifacts Section */}
                {entry.workArtifacts && entry.workArtifacts.length > 0 && (
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Link2 className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium text-foreground">Work Artifacts</h3>
                    </div>
                    <div className="space-y-2">
                      {entry.workArtifacts.map((artifact, idx) => (
                        <a
                          key={idx}
                          href={artifact.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg text-sm group hover:bg-muted/50 transition-colors"
                        >
                          <span className="flex-1 truncate text-foreground">{artifact.label || artifact.url}</span>
                          <span className="text-xs text-muted-foreground capitalize">{artifact.type}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Reflection - Simplified & Calm */}
                {aiReflection && (
                  <div className="pt-6 border-t border-border space-y-4">
                    {/* Summary - Single sentence, no quotes */}
                    {aiReflection.summary && (
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {aiReflection.summary}
                      </p>
                    )}

                    {/* Strengths Demonstrated - Kept as-is */}
                    {aiReflection.strengths && aiReflection.strengths.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Strengths Demonstrated
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {aiReflection.strengths.map((strength, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                            >
                              <Star className="w-3 h-3" />
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Highlights - Max 2 items */}
                    {aiReflection.highlights && aiReflection.highlights.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Key Highlights
                        </h4>
                        <ul className="space-y-1.5">
                          {aiReflection.highlights.slice(0, 2).map((highlight, idx) => (
                            <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                              <span className="text-muted-foreground mt-1">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Encouragement - Short, supportive */}
                    {aiReflection.encouragement && (
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          💪 {aiReflection.encouragement}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action buttons - bottom right */}
          <div className="flex items-center justify-end gap-2 pt-6 mt-auto border-t border-border">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  title="Edit entry"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your journal entry from {formatDate(entry.date)}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
