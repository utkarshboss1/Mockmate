'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SessionBlockEditor } from './SessionBlockEditor';
import { DayOfWeek } from '@interviewiq/shared';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, Clock, CalendarX } from 'lucide-react';

const DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

interface SlotRule {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export function WeeklyAvailabilityEditor() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') === 'blackout' ? 'blackout' : 'weekly';

  const [slots, setSlots] = useState<SlotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      try {
        setLoading(true);
        const res = await api.get('/availability/my-slots');
        setSlots(res.data.data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    fetchSlots();
  }, []);

  const addWindow = (day: DayOfWeek) => {
    setSlots([
      ...slots,
      { dayOfWeek: day, startTime: '09:00', endTime: '17:00', isActive: true },
    ]);
  };

  const removeWindow = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateWindow = (index: number, field: keyof SlotRule, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.put('/availability/my-slots', { slots });
      setSuccess('Weekly availability schedule updated successfully!');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Weekly Recurring Schedule
          </TabsTrigger>
          <TabsTrigger value="blackout" className="flex items-center gap-2">
            <CalendarX className="h-4 w-4" /> Session & Date Blackouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" /> Weekly Recurring Availability
              </CardTitle>
              <CardDescription>
                Define the recurring days and hours (in UTC) when candidates can book 60-minute mock interview sessions with you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

        <div className="space-y-6">
          {DAYS.map((day) => {
            const daySlots = slots.filter((s) => s.dayOfWeek === day);

            return (
              <div key={day} className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm capitalize">{day.toLowerCase()}s</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addWindow(day)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Time Window
                  </Button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Unavailable on {day.toLowerCase()}s</p>
                ) : (
                  <div className="space-y-2.5">
                    {slots.map((slot, globalIndex) => {
                      if (slot.dayOfWeek !== day) return null;

                      return (
                        <div
                          key={globalIndex}
                          className="flex flex-wrap items-center gap-3 bg-card p-2.5 rounded-lg border border-border/40"
                        >
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">From</Label>
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateWindow(globalIndex, 'startTime', e.target.value)}
                              className="h-8 text-xs w-28"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground">To</Label>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateWindow(globalIndex, 'endTime', e.target.value)}
                              className="h-8 text-xs w-28"
                            />
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <Switch
                              checked={slot.isActive}
                              onCheckedChange={(val: boolean) => updateWindow(globalIndex, 'isActive', val)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeWindow(globalIndex)}
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button onClick={handleSave} className="w-full font-semibold" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Schedule
        </Button>
      </CardContent>
    </Card>
        </TabsContent>

        <TabsContent value="blackout">
          <SessionBlockEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
