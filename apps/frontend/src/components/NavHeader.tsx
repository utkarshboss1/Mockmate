'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LogOut, LayoutDashboard, Loader2, ArrowRight } from 'lucide-react';

interface NavHeaderProps {
  showMarketplaceLink?: boolean;
}

export function NavHeader({ showMarketplaceLink = true }: NavHeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getRoleLabel = () => {
    if (user?.role === 'INTERVIEWER') return 'Interviewer';
    if (user?.role === 'ADMIN') return 'Admin';
    return 'Candidate';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-background/90 backdrop-blur-lg">
      <div className="container max-w-7xl h-16 flex items-center justify-between px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-0 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
        >
          <span className="text-lg font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary">
            MockMate
          </span>
        </Link>

        {/* Nav Links — uppercase, spaced, with focus states */}
        <nav className="hidden md:flex items-center gap-10 text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
          {showMarketplaceLink && (
            <Link
              href="/marketplace"
              className="hover:text-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
            >
              Interviewers
            </Link>
          )}
          <Link
            href="/login"
            className="hover:text-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            About
          </Link>
          <Link
            href="/register"
            className="hover:text-foreground transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            Contact
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="pulse-dot" />
              <span className="pulse-dot" />
            </div>
          ) : user ? (
            <>
              {/* Minimal user pill */}
              <div className="flex items-center gap-2 text-xs">
                <div className="h-7 w-7 rounded-full bg-primary/90 flex items-center justify-center text-[11px] font-bold text-primary-foreground transition-transform duration-200 hover:scale-105">
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[12px] font-medium text-foreground truncate max-w-[100px]">
                    {user.name || 'User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-wide uppercase">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>

              <Link href={user.role === 'INTERVIEWER' ? '/interviewer/dashboard' : '/dashboard'}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] font-medium gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-200"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 tracking-wide uppercase cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
              >
                <LogOut className="h-3.5 w-3.5 inline mr-1" />
                Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 tracking-wide uppercase cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-[11px] font-semibold gap-1.5 rounded-lg h-8 px-4 cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px glow-primary">
                  Get Started <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
