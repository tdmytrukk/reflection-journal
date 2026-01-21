import { useState, useRef } from 'react';
import { History, Pencil, Sprout, Upload, Loader2, Plus, ChevronDown, ChevronUp, Trash2, Linkedin } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { JobDescription } from '@/types';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleHistoryCardProps {
  roles: JobDescription[];
  isEditing: boolean;
  onAddRole: (role: Omit<JobDescription, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onUpdateRole: (id: string, updates: Partial<JobDescription>) => Promise<void>;
  onDeleteRole: (id: string) => Promise<void>;
}

interface ParsedPosition {
  title: string;
  company: string;
  startDate: string;
  endDate?: string | null;
  description?: string;
}

export function RoleHistoryCard({ roles, isEditing, onAddRole, onUpdateRole, onDeleteRole }: RoleHistoryCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({
    title: '',
    company: '',
    startDate: '',
    endDate: '',
    content: '',
  });
  const [editRole, setEditRole] = useState({
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

  const handleSaveEdit = async (id: string) => {
    if (!editRole.title || !editRole.company || !editRole.startDate) return;
    
    await onUpdateRole(id, {
      title: editRole.title,
      company: editRole.company,
      content: editRole.content,
      startDate: new Date(editRole.startDate),
      endDate: editRole.endDate ? new Date(editRole.endDate) : undefined,
    });
    
    setEditingRoleId(null);
  };

  const startEditing = (role: JobDescription) => {
    setEditRole({
      title: role.title,
      company: role.company,
      startDate: format(role.startDate, 'yyyy-MM'),
      endDate: role.endDate ? format(role.endDate, 'yyyy-MM') : '',
      content: role.content || '',
    });
    setEditingRoleId(role.id);
    setExpandedRoleId(role.id);
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

  // Check if a parsed position matches an existing role (same company + overlapping dates)
  const findMatchingExistingRole = (parsed: ParsedPosition): JobDescription | null => {
    const parsedStart = new Date(parsed.startDate);
    const parsedEnd = parsed.endDate ? new Date(parsed.endDate) : new Date();
    
    for (const role of roles) {
      const roleStart = role.startDate;
      const roleEnd = role.endDate || new Date();
      
      // Normalize company names for comparison
      const normalizedParsedCompany = parsed.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedRoleCompany = role.company.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Check if companies match (fuzzy)
      const companiesMatch = 
        normalizedParsedCompany.includes(normalizedRoleCompany) || 
        normalizedRoleCompany.includes(normalizedParsedCompany);
      
      // Check if dates overlap
      const datesOverlap = parsedStart <= roleEnd && parsedEnd >= roleStart;
      
      if (companiesMatch && datesOverlap) {
        return role;
      }
    }
    return null;
  };

  const handleImportPositions = async (selectedIndices: number[]) => {
    const positionsToImport = selectedIndices.map(i => parsedPositions[i]);
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const pos of positionsToImport) {
      const existingRole = findMatchingExistingRole(pos);
      
      if (existingRole) {
        // Update existing role
        await onUpdateRole(existingRole.id, {
          title: pos.title,
          company: pos.company,
          content: pos.description || existingRole.content,
          startDate: new Date(pos.startDate),
          endDate: pos.endDate ? new Date(pos.endDate) : undefined,
        });
        updatedCount++;
      } else {
        // Add new role
        await onAddRole({
          title: pos.title,
          company: pos.company,
          content: pos.description || '',
          responsibilities: [],
          startDate: new Date(pos.startDate),
          endDate: pos.endDate ? new Date(pos.endDate) : undefined,
        });
        importedCount++;
      }
    }
    
    if (updatedCount > 0 && importedCount > 0) {
      toast.success(`Imported ${importedCount} new role${importedCount !== 1 ? 's' : ''}, updated ${updatedCount} existing`);
    } else if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} existing role${updatedCount !== 1 ? 's' : ''}`);
    } else {
      toast.success(`Imported ${importedCount} role${importedCount !== 1 ? 's' : ''}!`);
    }
    
    setShowImportModal(false);
    setParsedPositions([]);
  };

  const handleLinkedInExport = () => {
    window.open('https://www.linkedin.com/mypreferences/d/download-my-data', '_blank');
    toast.info('Export your LinkedIn data, then upload the positions.csv file');
  };

  const toggleExpand = (roleId: string) => {
    if (editingRoleId === roleId) return; // Don't collapse while editing
    setExpandedRoleId(expandedRoleId === roleId ? null : roleId);
  };

  return (
    <>
      <div className="profile-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: '#3D3228' }}>
            <History className="w-5 h-5" style={{ color: '#8B6F47' }} />
            Career History
          </h3>
          
          {isEditing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.csv"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUploading}>
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" style={{ color: '#8B6F47' }} />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manually
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLinkedInExport}>
                    <Linkedin className="w-4 h-4 mr-2" />
                    Export from LinkedIn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        {roles.length > 0 ? (
          <div className="space-y-2">
            {roles.map((role) => (
              <div key={role.id} className="relative">
                {/* Clickable role item */}
                <button
                  onClick={() => toggleExpand(role.id)}
                  className="w-full text-left pl-6 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Timeline line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                    style={{
                      background: 'linear-gradient(180deg, #8B6F47 0%, #6B7A5A 100%)',
                    }}
                  />
                  
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: '#3D3228' }}>
                        {role.title}
                      </p>
                      <p style={{ color: '#7A6F5F' }}>{role.company}</p>
                      <p className="text-[13px]" style={{ color: '#8B7F6F' }}>
                        {format(role.startDate, 'MMM yyyy')} — {role.endDate ? format(role.endDate, 'MMM yyyy') : 'Present'}
                      </p>
                    </div>
                    {expandedRoleId === role.id ? (
                      <ChevronUp className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#8B7F6F' }} />
                    ) : (
                      <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#8B7F6F' }} />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedRoleId === role.id && (
                  <div className="pl-6 pb-4 space-y-3">
                    {editingRoleId === role.id ? (
                      // Edit form
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label className="text-xs">Job Title</Label>
                          <Input
                            value={editRole.title}
                            onChange={(e) => setEditRole({ ...editRole, title: e.target.value })}
                            className="input-paper h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Company</Label>
                          <Input
                            value={editRole.company}
                            onChange={(e) => setEditRole({ ...editRole, company: e.target.value })}
                            className="input-paper h-9"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Start Date</Label>
                            <MonthYearPicker
                              value={editRole.startDate}
                              onChange={(value) => setEditRole({ ...editRole, startDate: value })}
                              placeholder="Start"
                              maxDate={new Date()}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Date</Label>
                            <MonthYearPicker
                              value={editRole.endDate}
                              onChange={(value) => setEditRole({ ...editRole, endDate: value })}
                              placeholder="Present"
                              maxDate={new Date()}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={editRole.content}
                            onChange={(e) => setEditRole({ ...editRole, content: e.target.value })}
                            placeholder="Brief description of your role..."
                            className="textarea-journal min-h-[80px]"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setEditingRoleId(null)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            className="btn-serene"
                            onClick={() => handleSaveEdit(role.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {role.content && (
                          <div className="text-sm pt-2 whitespace-pre-line" style={{ color: '#5A5046' }}>
                            {role.content}
                          </div>
                        )}
                        {!role.content && (
                          <p className="text-sm italic pt-2" style={{ color: '#8B7F6F' }}>
                            No description added
                          </p>
                        )}
                        {isEditing && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(role);
                              }}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoleToDelete(role.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
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
            existingRoles={roles}
            findMatch={findMatchingExistingRole}
            onImport={handleImportPositions}
            onCancel={() => setShowImportModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this role?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The role will be permanently removed from your career history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (roleToDelete) {
                  onDeleteRole(roleToDelete);
                  setRoleToDelete(null);
                  if (expandedRoleId === roleToDelete) {
                    setExpandedRoleId(null);
                  }
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Separate component for import modal content
function ImportPositionsContent({ 
  positions,
  existingRoles,
  findMatch,
  onImport, 
  onCancel 
}: { 
  positions: ParsedPosition[];
  existingRoles: JobDescription[];
  findMatch: (pos: ParsedPosition) => JobDescription | null;
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
        Select the positions you'd like to import. Matching roles will be updated instead of duplicated.
      </p>
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {positions.map((pos, index) => {
          const existingMatch = findMatch(pos);
          return (
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium" style={{ color: '#3D3228' }}>
                      {pos.title}
                    </p>
                    {existingMatch && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                        Will update
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ color: '#7A6F5F' }}>
                    {pos.company}
                  </p>
                  <p className="text-xs" style={{ color: '#8B7F6F' }}>
                    {formatDateRange(pos.startDate, pos.endDate)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
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