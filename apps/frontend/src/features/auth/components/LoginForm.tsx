'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Sparkles, User, Briefcase } from 'lucide-react';
import { UserRole } from '@interviewiq/shared';
import { useAuth } from '@/lib/auth-context';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const roleParam = searchParams.get('role');
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    roleParam === 'interviewer' ? UserRole.INTERVIEWER : UserRole.CANDIDATE,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roleParam === 'interviewer') {
      setSelectedRole(UserRole.INTERVIEWER);
    }
  }, [roleParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        ...data,
        loginRole: selectedRole,
      });
      const result = response.data?.data;

      if (result?.user) {
        login(result.user, result.session);
      }

      const effectiveRole = result?.user?.role || selectedRole;

      if (redirectTo) {
        router.push(redirectTo);
      } else if (effectiveRole === UserRole.INTERVIEWER) {
        router.push('/interviewer/dashboard');
      } else if (effectiveRole === UserRole.ADMIN) {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-1 text-center pb-4">
        <div className="flex justify-center mb-2">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your InterviewIQ account to continue
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Role Selector Tabs / Block */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sign In As
            </Label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border/40">
              <button
                type="button"
                onClick={() => setSelectedRole(UserRole.CANDIDATE)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === UserRole.CANDIDATE
                    ? 'bg-card text-foreground shadow-md border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4 text-primary" />
                Candidate
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole(UserRole.INTERVIEWER)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                  selectedRole === UserRole.INTERVIEWER
                    ? 'bg-card text-foreground shadow-md border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Briefcase className="h-4 w-4 text-indigo-400" />
                Interviewer
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              {selectedRole === UserRole.INTERVIEWER
                ? 'Sign in to access your Interviewer Portal, manage sessions & earnings.'
                : 'Sign in to browse interviewers, practice mock sessions & view roadmaps.'}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder={selectedRole === UserRole.INTERVIEWER ? 'interviewer@example.com' : 'you@example.com'}
              autoComplete="email"
              disabled={loading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={loading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : selectedRole === UserRole.INTERVIEWER ? (
              'Sign In as Interviewer'
            ) : (
              'Sign In as Candidate'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href={selectedRole === UserRole.INTERVIEWER ? '/register?role=interviewer' : '/register'}
              className="text-primary hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
