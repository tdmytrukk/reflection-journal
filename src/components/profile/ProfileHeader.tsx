import { useState, useRef } from 'react';
import { User, Mail, Camera, Pencil, Check, X, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ImageCropDialog } from './ImageCropDialog';

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
  const { user } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [isUploading, setIsUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileSelect = (file: File) => {
    if (!user) {
      toast.error('You must be logged in to upload an avatar');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    // Create a URL for the image and open crop dialog
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setCropDialogOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Generate unique filename
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      await onUpdateAvatar(publicUrl);
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploading(false);
      // Clean up the object URL
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
        setSelectedImage(null);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
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
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#6B7A5A' }} />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials || <User className="w-10 h-10" />
            )}
          </div>
          
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {isEditing && !isUploading && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="absolute inset-0 rounded-full bg-ink/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  aria-label="Change photo"
                >
                  <Camera className="w-8 h-8 text-washi" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload from device
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => cameraInputRef.current?.click()}>
                  <Camera className="w-4 h-4 mr-2" />
                  Take a photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {selectedImage && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
