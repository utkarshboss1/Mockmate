import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata = {
  title: 'Register — InterviewIQ',
  description: 'Create your account to start practice mock interviews.',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <RegisterForm />
    </div>
  );
}
