import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, LayoutDashboard, AlertTriangle, FileText } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface HeaderProps {
  variant?: 'default' | 'transparent';
}

export const Header = ({ variant = 'default' }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut, isAdmin, isOrganizer } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isOrganizer) return '/organizer';
    return '/bookings';
  };

  return (
    <header className={cn(
      'sticky top-0 z-50 w-full',
      variant === 'default' 
        ? 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border'
        : 'bg-transparent'
    )}>
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <Logo 
            size="md" 
            variant={variant === 'transparent' ? 'white' : 'default'}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/trips" 
            className={cn(
              'text-sm font-medium transition-colors hover:text-accent',
              variant === 'transparent' ? 'text-white/90' : 'text-muted-foreground'
            )}
          >
            Find Trips
          </Link>
          <Link 
            to="/how-it-works" 
            className={cn(
              'text-sm font-medium transition-colors hover:text-accent',
              variant === 'transparent' ? 'text-white/90' : 'text-muted-foreground'
            )}
          >
            How It Works
          </Link>
          <Link 
            to="/travel-safe" 
            className={cn(
              'text-sm font-medium transition-colors hover:text-accent',
              variant === 'transparent' ? 'text-white/90' : 'text-muted-foreground'
            )}
          >
            Travel Safe
          </Link>
        </nav>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">
                    {profile?.full_name || 'Account'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {(isAdmin || isOrganizer) && (
                  <>
                    <DropdownMenuItem onClick={() => navigate(getDashboardPath())}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/bookings')}>
                  <User className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/submit-claim')}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Submit Damage Claim
                </DropdownMenuItem>
                {!isOrganizer && !isAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/apply-organizer')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Become an Organizer
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/auth?mode=signup')} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className={cn('w-6 h-6', variant === 'transparent' ? 'text-white' : 'text-foreground')} />
          ) : (
            <Menu className={cn('w-6 h-6', variant === 'transparent' ? 'text-white' : 'text-foreground')} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-background border-b border-border shadow-lg animate-slide-in-down">
          <nav className="container py-4 flex flex-col gap-4">
            <Link 
              to="/trips" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Trips
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link 
              to="/travel-safe" 
              className="text-sm font-medium text-foreground py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Travel Safe
            </Link>
            <div className="border-t border-border pt-4 flex flex-col gap-2">
              {user ? (
                <>
                  {(isAdmin || isOrganizer) && (
                    <Link 
                      to={getDashboardPath()} 
                      className="text-sm font-medium text-foreground py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/bookings" 
                    className="text-sm font-medium text-foreground py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <Button variant="outline" onClick={handleSignOut} className="justify-start">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>
                    Sign In
                  </Button>
                  <Button onClick={() => { navigate('/auth?mode=signup'); setMobileMenuOpen(false); }} className="bg-accent text-accent-foreground">
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};



