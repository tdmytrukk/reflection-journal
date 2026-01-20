import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Target, Lightbulb, Compass, BookOpen, Sparkles, Calendar, Star } from '@/components/ui/icons';
import type { Entry } from '@/types';

interface EntryDetailSheetProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
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

export function EntryDetailSheet({ entry, isOpen, onClose }: EntryDetailSheetProps) {
  if (!entry) return null;

  const categories = [
    { key: 'achievements', items: entry.achievements },
    { key: 'learnings', items: entry.learnings },
    { key: 'insights', items: entry.insights },
    { key: 'decisions', items: entry.decisions },
  ].filter(cat => cat.items.length > 0);

  const aiReflection = entry.aiReflection;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDate(entry.date)}</span>
          </div>
          <SheetTitle className="text-xl font-semibold text-foreground">
            Journal Entry
          </SheetTitle>
        </SheetHeader>

        {/* Entry Content by Category */}
        <div className="space-y-6">
          {categories.map(({ key, items }) => {
            const { Icon, label, color } = getCategoryDetails(key);
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <h3 className="text-sm font-medium text-foreground">{label}</h3>
                </div>
                <ul className="space-y-2 pl-6">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-sm text-foreground/90 leading-relaxed list-disc">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* AI Reflection Section */}
        {aiReflection && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-base font-medium text-foreground">AI Analysis</h3>
            </div>

            {/* Summary */}
            {aiReflection.summary && (
              <div className="mb-4">
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  "{aiReflection.summary}"
                </p>
              </div>
            )}

            {/* Strengths */}
            {aiReflection.strengths && aiReflection.strengths.length > 0 && (
              <div className="mb-4">
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

            {/* Highlights */}
            {aiReflection.highlights && aiReflection.highlights.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Key Highlights
                </h4>
                <ul className="space-y-1.5">
                  {aiReflection.highlights.map((highlight, idx) => (
                    <li key={idx} className="text-sm text-foreground/90 flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Encouragement */}
            {aiReflection.encouragement && (
              <div className="p-4 rounded-lg bg-sage-light/50 border border-sage-light">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  💪 {aiReflection.encouragement}
                </p>
              </div>
            )}
          </div>
        )}

        {/* No AI reflection message */}
        {!aiReflection && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">AI Analysis</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">
              AI reflection is being generated or not available for this entry.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
