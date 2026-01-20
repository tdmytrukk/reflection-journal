import { useState } from 'react';
import { User, Mail, Camera, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ProfileHeaderProps {
  name: string;
  email: string;
  avatarUrl?: string;
  isEditing: boolean;
  onUpdateName: (name: string) => Promise<void>;
  onUpdateAvatar: (url: string) => Promise<void>;
}

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  isEditing,
  onUpdateName,
  onUpdateAvatar,
}: ProfileHeaderProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const handleSaveName = async () => {
    if (tempName.trim()) {
      await onUpdateName(tempName.trim());
    }
    setEditingName(false);
  };
  
  const handleCancelName = () => {
    setTempName(name);
    setEditingName(false);
  };

  return (
    <div className="profile-card">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          <div 
            className="w-[120px] h-[120px] rounded-full flex items-center justify-center text-3xl font-medium overflow-hidden"
            style={{
              background: avatarUrl ? 'transparent' : 'rgba(107, 122, 90, 0.15)',
              color: '#6B7A5A',
              border: '3px solid rgba(107, 122, 90, 0.2)',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials || <User className="w-10 h-10" />
            )}
          </div>
          
          {isEditing && (
            <button 
              className="absolute inset-0 rounded-full bg-ink/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change photo"
            >
              <Camera className="w-8 h-8 text-washi" />
            </button>
          )}
        </div>
        
        {/* Name and Email */}
        <div className="flex-1">
          {editingName && isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-2xl font-normal h-auto py-1 px-2"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelName();
                }}
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 rounded-md hover:bg-moss/10 text-moss"
                aria-label="Save"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={handleCancelName}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div 
              className="flex items-center gap-2 mb-2 group/name cursor-pointer"
              onClick={() => isEditing && setEditingName(true)}
            >
              <h2 
                className="text-[28px] font-normal"
                style={{ color: '#3D3228' }}
              >
                {name || 'Your name'}
              </h2>
              {isEditing && (
                <Pencil className="w-4 h-4 text-cedar opacity-0 group-hover/name:opacity-100 transition-opacity" />
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2" style={{ color: '#8B7F6F' }}>
            <Mail className="w-4 h-4" style={{ color: '#8B6F47' }} />
            <span className="text-[15px]">{email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
