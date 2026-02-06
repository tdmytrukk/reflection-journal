import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DaoLogo } from '@/components/icons/DaoLogo';
import { Settings, LogOut, User } from '@/components/ui/icons';
import { ReflectScreen } from '@/components/dashboard/ReflectScreen';
import { ReviewScreen } from '@/components/dashboard/ReviewScreen';
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { useResponsibilities } from '@/hooks/useResponsibilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Tab = 'reflect' | 'review';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('reflect');
  const { user, signOut } = useAuth();
  const { profile, entries, isLoading, refreshData, updateEntry, deleteEntry } = useUserData();
  const { refreshData: refreshResponsibilities } = useResponsibilities();
  const navigate = useNavigate();

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';

  const handleEntrySaved = useCallback(() => {
    refreshData();
    refreshResponsibilities();
  }, [refreshData, refreshResponsibilities]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen paper-texture">
      {/* Unified header with tabs */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <button 
              onClick={() => setActiveTab('reflect')} 
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <DaoLogo size={20} className="text-primary" />
              <span className="text-foreground font-medium text-[15px]">Dao</span>
            </button>
            
            {/* Tab navigation - centered */}
            <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('reflect')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  activeTab === 'reflect'
                    ? 'bg-background text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Reflect
              </button>
              <button
                onClick={() => setActiveTab('review')}
                className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                  activeTab === 'review'
                    ? 'bg-background text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Review
              </button>
            </nav>
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 -m-1.5 rounded-lg hover:bg-accent/50 transition-colors">
                  <span className="text-foreground/80 text-sm hidden sm:block">{userName}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {profile?.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={userName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 sm:hidden">
                  <p className="text-foreground text-sm font-medium">{userName}</p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')} 
                  className="gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/settings')} 
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="gap-2 text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Screen content */}
      <main>
        {activeTab === 'reflect' ? (
          <ReflectScreen
            entries={entries}
            isLoading={isLoading}
            onEntrySaved={handleEntrySaved}
            onUpdateEntry={updateEntry}
            onDeleteEntry={deleteEntry}
          />
        ) : (
          <ReviewScreen entries={entries} />
        )}
      </main>
    </div>
  );
}
