'use client';

import { useState, useEffect } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CalendarX, Plus, Trash2, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

interface BlockedSlot {
  id: string;
  interviewerProfileId: string;
  startDateTime: string;
  endDateTime: string;
  reason?: string | null;
  createdAt: string;
}

export function SessionBlockEditor() {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [blockDate, setBlockDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [isFullDay, setIsFullDay] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    fetchBlockedSlots();
  }, []);

  async function fetchBlockedSlots() {
    try {
      setLoading(true);
      const res = await api.get('/availability/blocked-slots');
      setBlockedSlots(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      let startIso: string;
      let endIso: string;

      if (isFullDay) {
        startIso = new Date(`${blockDate}T00:00:00.000Z`).toISOString();
        endIso = new Date(`${blockDate}T23:59:59.999Z`).toISOString();
      } else {
        startIso = new Date(`${blockDate}T${startTime}:00.000Z`).toISOString();
        endIso = new Date(`${blockDate}T${endTime}:00.000Z`).toISOString();
      }

      await api.post('/availability/blocked-slots', {
        startDateTime: startIso,
        endDateTime: endIso,
        reason: reason.trim() || undefined,
      });

      setSuccess('Time window successfully blocked out!');
      setReason('');
      fetchBlockedSlots();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      setError(null);
      await api.delete(`/availability/blocked-slots/${id}`);
      setBlockedSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
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
    <div className="space-y-6">
      {/* Create Blackout Slot Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-destructive" /> Block Out Session / Time Range
          </CardTitle>
          <CardDescription>
            Black out specific dates or hours (vacation, personal time, conflicts). Candidates will not see or be able to book these times.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateBlock}>
          <CardContent className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blockDate">Date to Block</Label>
                <Input
                  id="blockDate"
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold">Full Day Blackout</Label>
                  <p className="text-[11px] text-muted-foreground">Block the entire 24-hour day</p>
                </div>
                <Switch checked={isFullDay} onCheckedChange={setIsFullDay} />
              </div>
            </div>

            {!isFullDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">From (UTC)</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">To (UTC)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Input
                id="reason"
                placeholder="e.g. Vacation, Personal Conflict, Doctor Appointment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full font-semibold gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Block Time Range
            </Button>
          </CardContent>
        </form>
      </Card>

      {/* Active Blackout Slots List */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Ban className="h-5 w-5 text-amber-400" /> Active Blackouts & Blocked Slots
          </CardTitle>
          <CardDescription>
            List of dates and time ranges currently blocked from your booking calendar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedSlots.length === 0 ? (
            <div className="text-center py-8 space-y-2 border border-dashed rounded-xl p-6 bg-card/40">
              <CalendarX className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No Active Time Blackouts</p>
              <p className="text-xs text-muted-foreground">
                Your candidates can book any active window from your recurring weekly schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedSlots.map((slot) => {
                const startDate = new Date(slot.startDateTime);
                const endDate = new Date(slot.endDateTime);
                const formattedDate = startDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const timeRange = `${startDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })} - ${endDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}`;

                return (
                  <div
                    key={slot.id}
                    className="flex flex-wrap items-center justify-between p-3.5 rounded-xl border border-destructive/20 bg-destructive/5 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <span>{formattedDate}</span>
                        <span className="text-xs font-mono text-muted-foreground">({timeRange})</span>
                      </div>
                      {slot.reason && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          Reason: <span className="text-foreground">{slot.reason}</span>
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlock(slot.id)}
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Unblock Slot
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
