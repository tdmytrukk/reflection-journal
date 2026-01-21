import { useState } from 'react';
import { Target, Plus, Check, MoreHorizontal, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Goal } from '@/types';
import { GOAL_CATEGORIES } from '@/types';
import { format } from 'date-fns';

interface GoalsCardProps {
  goals: Goal[];
  isEditing: boolean;
  onAddGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
}

export function GoalsCard({ goals, isEditing, onAddGoal, onUpdateGoal, onDeleteGoal }: GoalsCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    text: '',
    targetDate: '',
    category: 'custom' as Goal['category'],
  });

  const handleAddGoal = async () => {
    if (!newGoal.text) return;
    
    await onAddGoal({
      text: newGoal.text,
      targetDate: newGoal.targetDate ? new Date(newGoal.targetDate) : undefined,
      category: newGoal.category,
      status: 'on-track',
    });
    
    setNewGoal({ text: '', targetDate: '', category: 'custom' });
    setShowAddModal(false);
  };

  const toggleComplete = async (goal: Goal) => {
    const newStatus = goal.status === 'completed' ? 'on-track' : 'completed';
    await onUpdateGoal(goal.id, { status: newStatus });
  };

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'completed': return '#6B7A5A';
      case 'needs-attention': return '#C17A4F';
      default: return '#3D3228';
    }
  };

  const getCategoryLabel = (category: Goal['category']) => {
    return GOAL_CATEGORIES.find(c => c.value === category)?.label || 'Custom';
  };

  return (
    <>
      <div className="profile-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2" style={{ color: '#3D3228' }}>
            <Target className="w-5 h-5" style={{ color: '#6B7A5A' }} />
            Current Goals
          </h3>
          {isEditing && (
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="btn-serene h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {goals.length > 0 ? (
          <div className="space-y-3">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-3 rounded-lg border transition-all"
                style={{
                  background: goal.status === 'completed' ? 'rgba(107, 122, 90, 0.05)' : 'rgba(254, 253, 251, 0.8)',
                  borderColor: 'rgba(139, 111, 71, 0.12)',
                }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(goal)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                      style={{
                        borderColor: goal.status === 'completed' ? '#6B7A5A' : 'rgba(139, 111, 71, 0.3)',
                        background: goal.status === 'completed' ? '#6B7A5A' : 'transparent',
                      }}
                    >
                      {goal.status === 'completed' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium"
                      style={{
                        color: getStatusColor(goal.status),
                        textDecoration: goal.status === 'completed' ? 'line-through' : 'none',
                        opacity: goal.status === 'completed' ? 0.7 : 1,
                      }}
                    >
                      {goal.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: '#8B7F6F' }}>
                      <span className="strength-tag py-0.5 px-2 text-xs">
                        {getCategoryLabel(goal.category)}
                      </span>
                      {goal.targetDate && (
                        <span>Target: {format(goal.targetDate, 'MMM yyyy')}</span>
                      )}
                      {goal.status === 'needs-attention' && (
                        <span className="flex items-center gap-1" style={{ color: '#C17A4F' }}>
                          <AlertCircle className="w-3 h-3" />
                          Needs attention
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {isEditing && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-secondary/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onDeleteGoal(goal.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
              <Target className="w-8 h-8" style={{ color: '#6B7A5A' }} />
            </div>
            <p className="font-medium" style={{ color: '#3D3228' }}>
              Set your first goal
            </p>
            <p className="text-sm mt-1" style={{ color: '#8B7F6F' }}>
              What do you want to achieve this quarter?
            </p>
            {isEditing && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-text">What's your goal?</Label>
              <Textarea
                id="goal-text"
                value={newGoal.text}
                onChange={(e) => setNewGoal({ ...newGoal, text: e.target.value })}
                placeholder="e.g., Get promoted to Senior Manager"
                className="textarea-journal min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-category">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({ ...newGoal, category: value as Goal['category'] })}
                >
                  <SelectTrigger className="input-paper">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-date">Target Date (optional)</Label>
                <MonthYearPicker
                  value={newGoal.targetDate}
                  onChange={(value) => setNewGoal({ ...newGoal, targetDate: value })}
                  placeholder="Select target"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddGoal} 
                className="btn-serene"
                disabled={!newGoal.text}
              >
                Save Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
