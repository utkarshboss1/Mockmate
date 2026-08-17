'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OverallRating } from '@interviewiq/shared';
import { Loader2, AlertCircle, Award, CheckCircle2, Sparkles } from 'lucide-react';

const feedbackSchema = z.object({
  overallRating: z.nativeEnum(OverallRating),
  rawNotes: z.string().min(20, 'Detailed feedback must be at least 20 characters'),
  strengthsInput: z.string().optional(),
  weaknessesInput: z.string().optional(),
  recommendationsInput: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackFormProps {
  bookingId: string;
  candidateName: string;
}

export function FeedbackForm({ bookingId, candidateName }: FeedbackFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      overallRating: OverallRating.HIRE,
    },
  });

  const selectedRating = watch('overallRating');

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      setSaving(true);
      setError(null);

      const strengths = data.strengthsInput
        ? data.strengthsInput.split('\n').filter((s) => s.trim().length > 0)
        : [];
      const weaknesses = data.weaknessesInput
        ? data.weaknessesInput.split('\n').filter((w) => w.trim().length > 0)
        : [];
      const learningRecommendations = data.recommendationsInput
        ? data.recommendationsInput.split('\n').filter((r) => r.trim().length > 0)
        : [];

      await api.post('/feedback', {
        bookingId,
        rawNotes: data.rawNotes,
        overallRating: data.overallRating,
        strengths,
        weaknesses,
        learningRecommendations,
      });

      router.push(`/interviewer/dashboard?feedbackSubmitted=true`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Candidate Evaluation & Scorecard
        </CardTitle>
        <CardDescription>
          Submit detailed feedback for <span className="font-semibold text-foreground">{candidateName}</span>. Your feedback will be shared with the candidate to help them prepare.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Recommendation Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="overallRating">Overall Interview Recommendation *</Label>
            <Select
              value={selectedRating}
              onValueChange={(val) => setValue('overallRating', val as OverallRating)}
            >
              <SelectTrigger id="overallRating">
                <SelectValue placeholder="Select recommendation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OverallRating.STRONG_HIRE}>Strong Hire</SelectItem>
                <SelectItem value={OverallRating.HIRE}>Hire</SelectItem>
                <SelectItem value={OverallRating.BORDERLINE}>Borderline</SelectItem>
                <SelectItem value={OverallRating.NO_HIRE}>No Hire</SelectItem>
                <SelectItem value={OverallRating.STRONG_NO_HIRE}>Strong No Hire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Detailed Raw Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="rawNotes">Detailed Evaluation & Notes *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const raw = watch('rawNotes');
                  if (!raw || raw.length < 15) {
                    alert('Please enter at least 15 characters of notes before polishing with AI');
                    return;
                  }
                  try {
                    const res = await api.post('/ai/polish-feedback', { rawNotes: raw });
                    const ai = res.data.data;
                    if (ai.professionalSummary) setValue('rawNotes', ai.professionalSummary);
                    if (ai.strengths) setValue('strengthsInput', ai.strengths.join('\n'));
                    if (ai.weaknesses) setValue('weaknessesInput', ai.weaknesses.join('\n'));
                    if (ai.learningRecommendations) setValue('recommendationsInput', ai.learningRecommendations.join('\n'));
                  } catch (err) {
                    alert(getErrorMessage(err));
                  }
                }}
                className="h-7 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Sparkles className="h-3.5 w-3.5" /> Polish with AI (Gemini)
              </Button>
            </div>
            <Textarea
              id="rawNotes"
              rows={6}
              placeholder="Provide a comprehensive breakdown of technical skills, problem solving approach, edge case handling, and communication..."
              {...register('rawNotes')}
            />
            {errors.rawNotes && <p className="text-xs text-destructive">{errors.rawNotes.message}</p>}
          </div>

          {/* Key Strengths */}
          <div className="space-y-2">
            <Label htmlFor="strengthsInput">Key Strengths (One per line)</Label>
            <Textarea
              id="strengthsInput"
              rows={3}
              placeholder="e.g. Great code structure and readability&#10;Excellent communication while explaining algorithm"
              {...register('strengthsInput')}
            />
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-2">
            <Label htmlFor="weaknessesInput">Areas for Improvement (One per line)</Label>
            <Textarea
              id="weaknessesInput"
              rows={3}
              placeholder="e.g. Missed edge cases with null input arrays&#10;Could optimize space complexity from O(N) to O(1)"
              {...register('weaknessesInput')}
            />
          </div>

          {/* Learning Recommendations */}
          <div className="space-y-2">
            <Label htmlFor="recommendationsInput">Learning Recommendations / Resources (One per line)</Label>
            <Textarea
              id="recommendationsInput"
              rows={3}
              placeholder="e.g. Practice Graph DFS/BFS on LeetCode&#10;Read Designing Data-Intensive Applications Chapter 3"
              {...register('recommendationsInput')}
            />
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <Button type="submit" className="w-full font-semibold gap-2 glow-primary" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit Candidate Scorecard
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
