'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagSelector } from './TagSelector';
import { ExperienceLevel } from '@interviewiq/shared';
import { Loader2, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react';

const interviewerSchema = z.object({
  headline: z.string().min(5, 'Headline must be at least 5 characters').max(160),
  bio: z.string().min(20, 'Bio must be at least 20 characters').max(3000),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(50),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  pricePerHourRupees: z.number().min(100, 'Minimum price is ₹100/hr').max(50000),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
});

type InterviewerFormData = z.infer<typeof interviewerSchema>;

interface InterviewerOnboardingFormProps {
  initialData?: {
    headline: string;
    bio: string;
    company: string | null;
    jobTitle: string | null;
    yearsOfExperience: number;
    experienceLevel: ExperienceLevel;
    pricePerHourPaise: number;
    linkedinUrl: string | null;
    githubUrl: string | null;
    tags: string[];
  };
}

export function InterviewerOnboardingForm({ initialData }: InterviewerOnboardingFormProps) {
  const [tags, setTags] = useState<string[]>(initialData?.tags || ['Data Structures', 'Algorithms', 'System Design']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InterviewerFormData>({
    resolver: zodResolver(interviewerSchema),
    defaultValues: {
      headline: initialData?.headline || '',
      bio: initialData?.bio || '',
      company: initialData?.company || '',
      jobTitle: initialData?.jobTitle || '',
      yearsOfExperience: initialData?.yearsOfExperience || 5,
      experienceLevel: initialData?.experienceLevel || ExperienceLevel.SENIOR,
      pricePerHourRupees: initialData?.pricePerHourPaise ? initialData.pricePerHourPaise / 100 : 800, // Default ₹800/hr
      linkedinUrl: initialData?.linkedinUrl || '',
      githubUrl: initialData?.githubUrl || '',
    },
  });

  const selectedLevel = watch('experienceLevel');

  const onSubmit = async (data: InterviewerFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.put('/users/interviewer-profile', {
        ...data,
        tags,
      });

      setSuccess('Interviewer profile saved successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Interviewer Profile & Onboarding</CardTitle>
        <CardDescription>
          Set up your public profile, tech stack topics, and hourly rates in ₹ (INR) to start receiving mock interview bookings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Headline */}
          <div className="space-y-2">
            <Label htmlFor="headline">Professional Headline *</Label>
            <Input
              id="headline"
              placeholder="e.g. Senior Software Engineer @ Google | Ex-Amazon | 8+ yrs exp"
              {...register('headline')}
            />
            {errors.headline && <p className="text-xs text-destructive">{errors.headline.message}</p>}
          </div>

          {/* Company & Job Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Current / Past Company</Label>
              <Input id="company" placeholder="e.g. Google, Microsoft, Startup" {...register('company')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input id="jobTitle" placeholder="e.g. Staff Engineer" {...register('jobTitle')} />
            </div>
          </div>

          {/* Experience Level & Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <Select
                value={selectedLevel}
                onValueChange={(val) => setValue('experienceLevel', val as ExperienceLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ExperienceLevel.JUNIOR}>Junior (1-2 yrs)</SelectItem>
                  <SelectItem value={ExperienceLevel.MID}>Mid-Level (3-5 yrs)</SelectItem>
                  <SelectItem value={ExperienceLevel.SENIOR}>Senior (5-8 yrs)</SelectItem>
                  <SelectItem value={ExperienceLevel.STAFF}>Staff (8-12 yrs)</SelectItem>
                  <SelectItem value={ExperienceLevel.PRINCIPAL}>Principal (12+ yrs)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                {...register('yearsOfExperience', { valueAsNumber: true })}
              />
              {errors.yearsOfExperience && (
                <p className="text-xs text-destructive">{errors.yearsOfExperience.message}</p>
              )}
            </div>
          </div>

          {/* Pricing in Rupees */}
          <div className="space-y-2">
            <Label htmlFor="pricePerHourRupees">Hourly Rate (in ₹ INR) *</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <IndianRupee className="h-4 w-4" />
              </div>
              <Input
                id="pricePerHourRupees"
                type="number"
                className="pl-9"
                placeholder="800"
                {...register('pricePerHourRupees', { valueAsNumber: true })}
              />
            </div>
            {errors.pricePerHourRupees && (
              <p className="text-xs text-destructive">{errors.pricePerHourRupees.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Suggested rate: ₹500 - ₹2,500 / hour depending on seniority.
            </p>
          </div>

          {/* Tech Stack Topics */}
          <div className="space-y-2">
            <Label>Interview Topics & Skills Offered *</Label>
            <TagSelector selectedTags={tags} onChange={setTags} />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">About & Mock Interview Style *</Label>
            <Textarea
              id="bio"
              rows={5}
              placeholder="Describe your background, what candidates should expect in your session, and how you provide actionable feedback..."
              {...register('bio')}
            />
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
              <Input id="linkedinUrl" placeholder="https://linkedin.com/in/username" {...register('linkedinUrl')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub Profile URL</Label>
              <Input id="githubUrl" placeholder="https://github.com/username" {...register('githubUrl')} />
            </div>
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save & Update Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
