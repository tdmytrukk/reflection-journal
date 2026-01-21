import { useState, useRef } from 'react';
import { History, Plus, Sprout, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { JobDescription } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleHistoryCardProps {
  roles: JobDescription[];
  isEditing: boolean;
  onAddRole: (role: Omit<JobDescription, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
}

interface ParsedPosition {
  title: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
}

export function RoleHistoryCard({ roles, isEditing, onAddRole }: RoleHistoryCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRole, setNewRole] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    content: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPositions, setParsedPositions] = useState<ParsedPosition[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddRole = async () => {
    if (!newRole.title || !newRole.company || !newRole.startDate) return;
    
    await onAddRole({
      title: newRole.title,
      company: newRole.company,
      content: newRole.content,
      responsibilities: [],
      startDate: new Date(newRole.startDate),
      endDate: newRole.endDate ? new Date(newRole.endDate) : undefined,
    });
    
    setNewRole({ title: '', company: '', startDate: '', endDate: '', content: '' });
    setShowAddModal(false);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: formData,
      });

      if (error) {
        throw new Error(error.message || 'Failed to parse resume');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.positions && data.positions.length > 0) {
        setParsedPositions(data.positions);
        setShowImportModal(true);
        toast.success(`Found ${data.positions.length} positions in your resume!`);
      } else {
        toast.error('No work experience found in the resume');
      }
    } catch (err) {
      console.error('Resume upload error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportPositions = async (selectedIndices: number[]) => {
    const positionsToImport = selectedIndices.map(i => parsedPositions[i]);
    
    for (const pos of positionsToImport) {
      await onAddRole({
        title: pos.title,
        company: pos.company,
        content: pos.description || '',
        responsibilities: [],
        startDate: new Date(pos.startDate),
        endDate: pos.endDate ? new Date(pos.endDate) : undefined,
      });
    }
    
    toast.success(`Imported ${positionsToImport.length} roles!`);
    setShowImportModal(false);
    setParsedPositions([]);
  };

  return (
    <>
      <div className="profile-card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: '#3D3228' }}>
          <History className="w-5 h-5" style={{ color: '#8B6F47' }} />
          Career History
        </h3>

        {roles.length > 0 ? (
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role.id} className="relative pl-6">
                {/* Timeline line */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                  style={{
                    background: 'linear-gradient(180deg, #8B6F47 0%, #6B7A5A 100%)',
                  }}
                />
                
                {/* Role details */}
                <div className="pb-4">
                  <p className="font-medium" style={{ color: '#3D3228' }}>
                    {role.title}
                  </p>
                  <p style={{ color: '#7A6F5F' }}>{role.company}</p>
                  <p className="text-[13px]" style={{ color: '#8B7F6F' }}>
                    {format(role.startDate, 'MMM yyyy')} — {role.endDate ? format(role.endDate, 'MMM yyyy') : 'Present'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div 
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(107, 122, 90, 0.1)' }}
            >
              <Sprout className="w-8 h-8" style={{ color: '#6B7A5A' }} />
            </div>
            <p className="font-medium" style={{ color: '#3D3228' }}>
              Your career journey starts here
            </p>
            <p className="text-sm mt-1" style={{ color: '#8B7F6F' }}>
              Add your past roles to track your growth
            </p>
          </div>
        )}

        {isEditing && (
          <div className="space-y-2 mt-4">
            {/* Resume upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleResumeUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Parsing resume...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Previous Role
            </Button>
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Previous Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-title">Job Title</Label>
              <Input
                id="role-title"
                value={newRole.title}
                onChange={(e) => setNewRole({ ...newRole, title: e.target.value })}
                placeholder="e.g., Marketing Manager"
                className="input-paper"
              />
            </div>
            <div>
              <Label htmlFor="role-company">Company</Label>
              <Input
                id="role-company"
                value={newRole.company}
                onChange={(e) => setNewRole({ ...newRole, company: e.target.value })}
                placeholder="e.g., Acme Inc."
                className="input-paper"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role-start">Start Date</Label>
                <MonthYearPicker
                  value={newRole.startDate}
                  onChange={(value) => setNewRole({ ...newRole, startDate: value })}
                  placeholder="Select start"
                  maxDate={new Date()}
                />
              </div>
              <div>
                <Label htmlFor="role-end">End Date</Label>
                <MonthYearPicker
                  value={newRole.endDate}
                  onChange={(value) => setNewRole({ ...newRole, endDate: value })}
                  placeholder="Present"
                  maxDate={new Date()}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="role-desc">Job Description (optional)</Label>
              <Textarea
                id="role-desc"
                value={newRole.content}
                onChange={(e) => setNewRole({ ...newRole, content: e.target.value })}
                placeholder="Brief description of your responsibilities..."
                className="textarea-journal min-h-[100px]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddRole} 
                className="btn-serene"
                disabled={!newRole.title || !newRole.company || !newRole.startDate}
              >
                Add Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Positions Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Work Experience</DialogTitle>
          </DialogHeader>
          <ImportPositionsContent 
            positions={parsedPositions} 
            onImport={handleImportPositions}
            onCancel={() => setShowImportModal(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Separate component for import modal content
function ImportPositionsContent({ 
  positions, 
  onImport, 
  onCancel 
}: { 
  positions: ParsedPosition[]; 
  onImport: (indices: number[]) => void;
  onCancel: () => void;
}) {
  const [selectedIndices, setSelectedIndices] = useState<number[]>(
    positions.map((_, i) => i) // Select all by default
  );

  const togglePosition = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatDateRange = (start: string, end?: string | null) => {
    const startDate = new Date(start);
    const startStr = format(startDate, 'MMM yyyy');
    
    if (!end) return `${startStr} — Present`;
    
    const endDate = new Date(end);
    return `${startStr} — ${format(endDate, 'MMM yyyy')}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the positions you'd like to import:
      </p>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {positions.map((pos, index) => (
          <button
            key={index}
            onClick={() => togglePosition(index)}
            className={`w-full text-left p-3 rounded-lg border transition-colors ${
              selectedIndices.includes(index)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div 
                className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedIndices.includes(index)
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30'
                }`}
              >
                {selectedIndices.includes(index) && (
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ color: '#3D3228' }}>
                  {pos.title}
                </p>
                <p className="text-sm" style={{ color: '#7A6F5F' }}>
                  {pos.company}
                </p>
                <p className="text-xs" style={{ color: '#8B7F6F' }}>
                  {formatDateRange(pos.startDate, pos.endDate)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={() => onImport(selectedIndices)}
          className="btn-serene"
          disabled={selectedIndices.length === 0}
        >
          Import {selectedIndices.length} Role{selectedIndices.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}
