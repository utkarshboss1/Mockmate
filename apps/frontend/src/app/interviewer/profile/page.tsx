import { InterviewerOnboardingForm } from '@/features/profile/components/InterviewerOnboardingForm';

export const metadata = {
  title: 'Interviewer Profile & Onboarding — InterviewIQ',
};

export default function InterviewerProfilePage() {
  return (
    <div className="container max-w-4xl py-10">
      <InterviewerOnboardingForm />
    </div>
  );
}
