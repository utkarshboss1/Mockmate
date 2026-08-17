'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface CandidateProfileFormProps {
  initialData: {
    name: string;
    email: string;
    avatar: string | null;
  };
}

export function CandidateProfileForm({ initialData }: CandidateProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData.avatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name,
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAvatarUrl(response.data.data.avatarUrl);
      setSuccess('Avatar uploaded successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.put('/users/profile', {
        name: data.name,
        avatar: avatarUrl,
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl">Candidate Profile</CardTitle>
        <CardDescription>Update your personal information and avatar image</CardDescription>
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

          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={initialData.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(initialData.name)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <Label htmlFor="avatar-file" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md border border-input bg-background hover:bg-accent transition-colors">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? 'Uploading...' : 'Change Avatar'}
                </div>
              </Label>
              <input
                id="avatar-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">JPG, PNG or WEBP up to 5MB</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={initialData.email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} disabled={saving} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
