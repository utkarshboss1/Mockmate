'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import {
  LogOut,
  LayoutDashboard,
  Calendar,
  Clock,
  Briefcase,
  User,
  ShieldCheck,
  Menu,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface NavHeaderProps {
  showMarketplaceLink?: boolean;
}

export function NavHeader({ showMarketplaceLink = true }: NavHeaderProps) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const getRoleLabel = () => {
    if (user?.role === 'INTERVIEWER') return 'Interviewer';
    if (user?.role === 'ADMIN') return 'Admin';
    return 'Candidate';
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
      <div className="container max-w-7xl h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary rounded-sm"
          >
            <span className="text-xl font-bold tracking-tight text-foreground font-heading transition-colors duration-200 group-hover:text-primary">
              MockMate
            </span>
            <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium tracking-wide">
            {showMarketplaceLink && user?.role !== 'INTERVIEWER' && (
              <Link
                href="/marketplace"
                className={`transition-colors duration-200 cursor-pointer ${
                  isActive('/marketplace')
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Marketplace
              </Link>
            )}

            {user?.role !== 'INTERVIEWER' && <Link
              href="/pricing"
              className={`transition-colors duration-200 cursor-pointer ${
                isActive('/pricing')
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pricing
            </Link>}

            {user?.role === 'INTERVIEWER' && (
              <>
                <Link
                  href="/interviewer/dashboard"
                  className={`transition-colors duration-200 cursor-pointer ${
                    isActive('/interviewer/dashboard')
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/interviewer/bookings"
                  className={`transition-colors duration-200 cursor-pointer ${
                    isActive('/interviewer/bookings')
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Sessions
                </Link>
                <Link
                  href="/interviewer/availability"
                  className={`transition-colors duration-200 cursor-pointer ${
                    isActive('/interviewer/availability')
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Availability
                </Link>
              </>
            )}

            {user?.role === 'CANDIDATE' && (
              <>
                <Link
                  href="/dashboard"
                  className={`transition-colors duration-200 cursor-pointer ${
                    isActive('/dashboard')
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Dashboard
                </Link>
                <Link
                  href="/bookings"
                  className={`transition-colors duration-200 cursor-pointer ${
                    isActive('/bookings')
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  My Bookings
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                className={`transition-colors duration-200 cursor-pointer ${
                  isActive('/admin/dashboard')
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Admin Panel
              </Link>
            )}

            {!user && !isLoading && (
              <>
                <Link
                  href="/#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  How it Works
                </Link>
                <Link
                  href="/register?role=interviewer"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  Become an Interviewer
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Right: Auth Controls & User Profile */}
        <div className="hidden md:flex items-center gap-3">
          {isLoading ? (
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="pulse-dot" />
              <span className="pulse-dot" />
            </div>
          ) : user ? (
            <>
              {/* User Identity Chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-white/[0.08] shadow-sm">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col text-left pr-1">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                    {user.name || 'User'}
                  </span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>

              <Link
                href={user.role === 'INTERVIEWER' ? '/interviewer/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium gap-1.5 border-white/[0.1] bg-card/40 hover:bg-card cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                onClick={handleLogout}
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs font-semibold glow-primary gap-1.5 rounded-lg px-4 cursor-pointer">
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {user && (
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-background/95 backdrop-blur-2xl px-6 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">{user.name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user.email} • {getRoleLabel()}</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 text-sm font-medium">
            {user?.role !== 'INTERVIEWER' && <Link
              href="/marketplace"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Browse Interviewers
            </Link>}

            {user?.role !== 'INTERVIEWER' && <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Pricing & Plans
            </Link>}

            {user?.role === 'INTERVIEWER' && (
              <>
                <Link
                  href="/interviewer/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Interviewer Dashboard
                </Link>
                <Link
                  href="/interviewer/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  My Sessions
                </Link>
                <Link
                  href="/interviewer/availability"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Availability & Schedule
                </Link>
              </>
            )}

            {user?.role === 'CANDIDATE' && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Candidate Dashboard
                </Link>
                <Link
                  href="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  My Booked Sessions
                </Link>
              </>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                Admin Panel
              </Link>
            )}

            {!user && (
              <>
                <Link
                  href="/register?role=interviewer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-1.5 text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Join as an Interviewer
                </Link>
                <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-center glow-primary">
                      Get Started <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {user && (
              <div className="pt-3 border-t border-white/[0.06]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-sm text-destructive hover:opacity-80 py-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
