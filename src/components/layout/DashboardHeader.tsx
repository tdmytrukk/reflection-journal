import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/hooks/useUserData';
import { RistLogo } from '@/components/icons/RistLogo';
import { Settings, LogOut, User } from '@/components/ui/icons';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { profile } = useUserData();
  const navigate = useNavigate();
  
  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = profile?.email || user?.email || '';
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <header className="nav-header sticky top-0 z-40">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center shadow-subtle">
              <RistLogo size={20} className="text-primary" />
            </div>
            <span className="text-lg font-medium text-warm-primary">Rist</span>
          </div>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 -m-2 rounded-lg hover:bg-primary/5 transition-colors">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-warm-primary">{userName}</p>
                  <p className="text-xs text-warm-muted">{userEmail}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-overlay">
              <div className="px-2 py-1.5 sm:hidden">
                <p className="text-sm font-medium text-warm-primary">{userName}</p>
                <p className="text-xs text-warm-muted">{userEmail}</p>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}