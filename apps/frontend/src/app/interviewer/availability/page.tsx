import { Suspense } from 'react';
import { WeeklyAvailabilityEditor } from '@/features/availability/components/WeeklyAvailabilityEditor';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Manage Availability — InterviewIQ',
};

export default function InterviewerAvailabilityPage() {
  return (
    <div className="container max-w-5xl py-10">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <WeeklyAvailabilityEditor />
      </Suspense>
    </div>
  );
}
