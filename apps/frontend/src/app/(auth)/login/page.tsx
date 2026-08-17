import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = {
  title: 'Sign In — InterviewIQ',
  description: 'Sign in to access your mock interview dashboard.',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <LoginForm />
    </div>
  );
}
