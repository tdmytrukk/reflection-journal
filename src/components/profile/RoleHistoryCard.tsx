import { useState } from 'react';
import { History, Plus, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { JobDescription } from '@/types';
import { format } from 'date-fns';

interface RoleHistoryCardProps {
  roles: JobDescription[];
  isEditing: boolean;
  onAddRole: (role: Omit<JobDescription, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
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

  return (
    <>
      <div className="profile-card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2" style={{ color: '#3D3228' }}>
          <History className="w-5 h-5" style={{ color: '#8B6F47' }} />
          Career History
        </h3>

        {roles.length > 0 ? (
          <div className="space-y-4">
            {roles.map((role, index) => (
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
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Previous Role
          </Button>
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
                <Input
                  id="role-start"
                  type="month"
                  value={newRole.startDate}
                  onChange={(e) => setNewRole({ ...newRole, startDate: e.target.value })}
                  className="input-paper"
                />
              </div>
              <div>
                <Label htmlFor="role-end">End Date</Label>
                <Input
                  id="role-end"
                  type="month"
                  value={newRole.endDate}
                  onChange={(e) => setNewRole({ ...newRole, endDate: e.target.value })}
                  className="input-paper"
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
    </>
  );
}
