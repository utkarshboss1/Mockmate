'use client';

import { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Users, IndianRupee, Award, ShieldAlert, Search, CheckCircle2, UserX, AlertCircle } from 'lucide-react';
import { UserStatus } from '@interviewiq/shared';

interface AdminAnalytics {
  totalPlatformRevenuePaise?: number;
  totalGrossVolumePaise?: number;
  totalUsers?: number;
  totalCandidates?: number;
  totalInterviewers?: number;
  completedBookings?: number;
  totalBookings?: number;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAdminData() {
      try {
        setLoading(true);
        setError(null);
        const [analyticsRes, usersRes] = await Promise.all([
          api.get('/admin/analytics', { signal: controller.signal }),
          api.get('/admin/users', { params: { search: debouncedSearch }, signal: controller.signal }),
        ]);

        setAnalytics(analyticsRes.data.data);
        setUsers(usersRes.data.data);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(err));
          console.error('Failed to load admin analytics:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    fetchAdminData();

    return () => controller.abort();
  }, [debouncedSearch]);

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      toast.success(`User ${newStatus === UserStatus.ACTIVE ? 'reactivated' : 'suspended'}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="container max-w-7xl py-10 px-4 space-y-8">
      {/* Header Banner */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-primary" /> Admin Control & Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor platform metrics, revenue split, and user account status moderation.
        </p>
      </div>

      {/* Metrics Cards */}
      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>Failed to load admin data: {error}</span>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Platform Net Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(analytics?.totalPlatformRevenuePaise || 0)}
              </div>
              <p className="text-xs text-muted-foreground">15% platform cut</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total GMV Bookings</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.totalGrossVolumePaise || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Total gross volume processed</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Platform Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {analytics?.totalCandidates || 0} Candidates • {analytics?.totalInterviewers || 0} Interviewers
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">Completed Interviews</CardTitle>
              <Award className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{analytics?.completedBookings || 0}</div>
              <p className="text-xs text-muted-foreground">Out of {analytics?.totalBookings || 0} total bookings</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Moderation Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-bold">User Management & Moderation</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              aria-label="Search users by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/40">
              <tr>
                <th className="p-3 pl-4">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined</th>
                <th className="p-3 text-right pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 pl-4 font-semibold text-foreground">{u.name}</td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-[10px] capitalize font-normal">
                      {u.role.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {u.status === 'ACTIVE' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px]">
                        Suspended
                      </Badge>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(u.createdAt)}</td>
                  <td className="p-3 text-right pr-4">
                    <Button
                      variant={u.status === 'SUSPENDED' ? 'outline' : 'destructive'}
                      size="sm"
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className="h-7 text-[11px] gap-1"
                    >
                      {u.status === 'SUSPENDED' ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Reactivate
                        </>
                      ) : (
                        <>
                          <UserX className="h-3 w-3" /> Suspend
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
