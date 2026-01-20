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
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(254,253,251,0.9)] flex items-center justify-center shadow-subtle border border-[rgba(139,111,71,0.1)]">
              <RistLogo size={22} className="text-moss" />
            </div>
            <span className="text-warm-primary" style={{ fontSize: '18px', fontWeight: 500 }}>Rist</span>
          </div>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-[rgba(107,122,90,0.06)] transition-all duration-300">
                <div className="text-right hidden sm:block">
                  <p className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>{userName}</p>
                  <p className="text-warm-muted" style={{ fontSize: '12px' }}>{userEmail}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[rgba(107,122,90,0.1)] flex items-center justify-center">
                  <User className="w-5 h-5 text-moss" strokeLinecap="round" />
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-overlay bg-[#FEFDFB] border-[rgba(139,111,71,0.12)]">
              <div className="px-3 py-2 sm:hidden">
                <p className="text-warm-primary" style={{ fontSize: '14px', fontWeight: 500 }}>{userName}</p>
                <p className="text-warm-muted" style={{ fontSize: '12px' }}>{userEmail}</p>
              </div>
              <DropdownMenuSeparator className="sm:hidden bg-[rgba(139,111,71,0.1)]" />
              <DropdownMenuItem 
                onClick={() => navigate('/profile')} 
                className="gap-3 py-2.5 text-warm-body cursor-pointer hover:bg-[rgba(107,122,90,0.06)]"
              >
                <User className="w-4 h-4 text-cedar" strokeLinecap="round" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-2.5 text-warm-body cursor-pointer hover:bg-[rgba(107,122,90,0.06)]">
                <Settings className="w-4 h-4 text-cedar" strokeLinecap="round" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[rgba(139,111,71,0.1)]" />
              <DropdownMenuItem onClick={handleLogout} className="gap-3 py-2.5 text-destructive cursor-pointer hover:bg-[rgba(139,67,73,0.06)]">
                <LogOut className="w-4 h-4" strokeLinecap="round" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
