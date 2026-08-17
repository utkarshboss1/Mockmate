'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { Code2, ArrowRight, LogOut, LayoutDashboard, Loader2, User, Briefcase, ShieldCheck } from 'lucide-react';

interface NavHeaderProps {
  /** Show "Find Interviewers" nav link */
  showMarketplaceLink?: boolean;
}

export function NavHeader({ showMarketplaceLink = true }: NavHeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRoleIcon = () => {
    if (user?.role === 'INTERVIEWER') return <Briefcase className="h-3.5 w-3.5 text-indigo-400" />;
    if (user?.role === 'ADMIN') return <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />;
    return <User className="h-3.5 w-3.5 text-primary" />;
  };

  const getRoleLabel = () => {
    if (user?.role === 'INTERVIEWER') return 'Interviewer';
    if (user?.role === 'ADMIN') return 'Admin';
    return 'Candidate';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
      <div className="container max-w-7xl h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-violet-400 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">MockMate</span>
        </Link>

        {showMarketplaceLink && (
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-muted-foreground">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">
              Find Interviewers
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              {/* User Identity Pill Icon Badge */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-card/90 border border-border/60 shadow-sm backdrop-blur-md">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner ${
                      user.role === 'INTERVIEWER'
                        ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 ring-2 ring-indigo-500/20'
                        : user.role === 'ADMIN'
                          ? 'bg-gradient-to-tr from-amber-600 to-orange-500 ring-2 ring-amber-500/20'
                          : 'bg-gradient-to-tr from-primary to-emerald-400 ring-2 ring-primary/20'
                    }`}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : getRoleIcon()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                      user.role === 'INTERVIEWER'
                        ? 'bg-indigo-400'
                        : user.role === 'ADMIN'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                    }`}
                  />
                </div>

                <div className="flex flex-col text-left hidden sm:flex pr-1">
                  <span className="text-xs font-semibold text-foreground leading-tight max-w-[110px] truncate">
                    {user.name || 'User'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
                    {getRoleIcon()}
                    <span>{getRoleLabel()}</span>
                  </div>
                </div>
              </div>

              <Link href={user.role === 'INTERVIEWER' ? '/interviewer/dashboard' : '/dashboard'}>
                <Button variant="ghost" size="sm" className="text-xs font-medium gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-medium border-border/60 gap-1.5"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs font-semibold glow-primary gap-1.5">
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
