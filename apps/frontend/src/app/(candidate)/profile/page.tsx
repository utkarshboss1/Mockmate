import { CandidateProfileForm } from '@/features/profile/components/CandidateProfileForm';

export const metadata = {
  title: 'My Profile — InterviewIQ',
};

export default function CandidateProfilePage() {
  // In real runtime client side this loads from user context or SSR
  const sampleUser = {
    name: 'Candidate User',
    email: 'candidate@interviewiq.com',
    avatar: null,
  };

  return (
    <div className="container max-w-4xl py-10">
      <CandidateProfileForm initialData={sampleUser} />
    </div>
  );
}
