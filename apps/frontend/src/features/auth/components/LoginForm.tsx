'use client';

import { useState } from 'react';
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
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
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
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      const response = await api.post('/auth/login', data);
      const result = response.data?.data;

      if (result?.user) {
        login(result.user, result.session);
      }

      const effectiveRole = result?.user?.role;

      // Only allow same-site relative redirect targets (blocks open redirects
      // to absolute URLs like https://evil.com)
      const safeRedirect =
        redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : null;

      if (safeRedirect) {
        router.push(safeRedirect);
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
              placeholder="you@example.com"
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
            ) : (
              'Sign In'
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
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
