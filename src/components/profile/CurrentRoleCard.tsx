import { useState } from 'react';
import { Briefcase, Calendar, FileText, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { JobDescription } from '@/types';
import { format } from 'date-fns';
import { ResponsibilitiesSection } from './ResponsibilitiesSection';

interface CurrentRoleCardProps {
  job: JobDescription | null;
  isEditing: boolean;
  onUpdate: (updates: Partial<JobDescription>) => Promise<void>;
}

export function CurrentRoleCard({ job, isEditing, onUpdate }: CurrentRoleCardProps) {
  const [showJobDesc, setShowJobDesc] = useState(false);
  const [editingField, setEditingField] = useState<'title' | 'company' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempJobDesc, setTempJobDesc] = useState('');

  const handleEditField = (field: 'title' | 'company') => {
    if (!isEditing || !job) return;
    setEditingField(field);
    setTempValue(job[field]);
  };

  const handleSaveField = async () => {
    if (!editingField || !tempValue.trim()) return;
    await onUpdate({ [editingField]: tempValue.trim() });
    setEditingField(null);
    setTempValue('');
  };

  const handleCancelField = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleOpenJobDesc = () => {
    setTempJobDesc(job?.content || '');
    setShowJobDesc(true);
  };

  const handleSaveJobDesc = async () => {
    await onUpdate({ content: tempJobDesc });
    setShowJobDesc(false);
  };

  if (!job) {
    return (
      <div className="profile-card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: '#3D3228' }}>
          <Briefcase className="w-5 h-5" style={{ color: '#8B6F47' }} />
          Current Role
        </h3>
        <p className="text-muted-foreground italic">No role information available</p>
      </div>
    );
  }

  return (
    <>
      <div className="profile-card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: '#3D3228' }}>
          <Briefcase className="w-5 h-5" style={{ color: '#8B6F47' }} />
          Current Role
        </h3>

        <div className="space-y-3">
          {/* Job Title */}
          {editingField === 'title' ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="text-lg h-auto py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveField();
                  if (e.key === 'Escape') handleCancelField();
                }}
              />
              <button onClick={handleSaveField} className="p-1 text-moss hover:bg-moss/10 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancelField} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className="group/field flex items-center gap-2 cursor-pointer"
              onClick={() => handleEditField('title')}
            >
              <span className="text-lg" style={{ color: '#4A4036' }}>
                {job.title || 'Your job title'}
              </span>
              {isEditing && (
                <Pencil className="w-3.5 h-3.5 text-cedar opacity-0 group-hover/field:opacity-100 transition-opacity" />
              )}
            </div>
          )}

          {/* Company */}
          {editingField === 'company' ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="h-auto py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveField();
                  if (e.key === 'Escape') handleCancelField();
                }}
              />
              <button onClick={handleSaveField} className="p-1 text-moss hover:bg-moss/10 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancelField} className="p-1 text-destructive hover:bg-destructive/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              className="group/field flex items-center gap-2 cursor-pointer"
              onClick={() => handleEditField('company')}
            >
              <span style={{ color: '#7A6F5F' }}>
                at {job.company || 'Company name'}
              </span>
              {isEditing && (
                <Pencil className="w-3.5 h-3.5 text-cedar opacity-0 group-hover/field:opacity-100 transition-opacity" />
              )}
            </div>
          )}

          {/* Start Date */}
          <div className="flex items-center gap-2 text-sm" style={{ color: '#8B7F6F' }}>
            <Calendar className="w-4 h-4" />
            <span>Since {format(job.startDate, 'MMMM yyyy')}</span>
          </div>

          {/* Job Description Link */}
          <button
            onClick={handleOpenJobDesc}
            className="flex items-center gap-2 text-sm mt-4 hover:underline"
            style={{ color: '#6B7A5A' }}
          >
            <FileText className="w-4 h-4" />
            View/Edit Job Description
          </button>
        </div>

        {/* Responsibilities Section */}
        <ResponsibilitiesSection />
      </div>

      {/* Job Description Modal */}
      <Dialog open={showJobDesc} onOpenChange={setShowJobDesc}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job Description</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This description helps generate personalized performance reviews.
            </p>
            <Textarea
              value={tempJobDesc}
              onChange={(e) => setTempJobDesc(e.target.value)}
              className="min-h-[300px] textarea-journal"
              placeholder="Paste your job description here..."
              disabled={!isEditing}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                Last updated: {format(job.createdAt, 'MMM d, yyyy')}
              </span>
              {isEditing && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowJobDesc(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveJobDesc} className="btn-serene">
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
