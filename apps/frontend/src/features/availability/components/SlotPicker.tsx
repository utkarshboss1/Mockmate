'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Check } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface SlotPickerProps {
  interviewerProfileId: string;
  selectedSlotIso: string | null;
  onSelectSlot: (isoString: string) => void;
}

export function SlotPicker({ interviewerProfileId, selectedSlotIso, onSelectSlot }: SlotPickerProps) {
  const [dates, setDates] = useState<{ date: string; slots: string[] }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookableSlots() {
      try {
        setLoading(true);
        const res = await api.get(`/availability/interviewers/${interviewerProfileId}/slots`);
        const result = res.data.data;
        setDates(result);
        if (result.length > 0) {
          setSelectedDate(result[0].date);
        }
      } catch (err) {
        console.error('Failed to load bookable slots:', err);
      } finally {
        setLoading(false);
      }
    }

    if (interviewerProfileId) {
      fetchBookableSlots();
    }
  }, [interviewerProfileId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed rounded-xl p-4 bg-muted/20">
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">No available time slots</p>
        <p className="text-xs text-muted-foreground">
          This interviewer hasn&apos;t set up bookable times for the upcoming two weeks.
        </p>
      </div>
    );
  }

  const activeDateObj = dates.find((d) => d.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Date Picker Bar */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          1. Select Date
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {dates.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setSelectedDate(d.date)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-xs font-medium shrink-0 transition-all ${
                selectedDate === d.date
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border/60 bg-card hover:bg-accent hover:border-border'
              }`}
            >
              <span>{formatDate(d.date).split(',')[0]}</span>
              <span className="text-sm font-bold mt-0.5">{d.date.split('-')[2]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time Chips Picker */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          2. Select Time (60-Min Session)
        </span>
        {!activeDateObj || activeDateObj.slots.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No time slots available for this date.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {activeDateObj.slots.map((isoSlot) => {
              const isSelected = selectedSlotIso === isoSlot;

              return (
                <Button
                  key={isoSlot}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSelectSlot(isoSlot)}
                  className={`gap-1.5 justify-start text-xs font-medium h-10 ${
                    isSelected ? 'glow-primary' : ''
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(isoSlot)}
                  {isSelected && <Check className="h-3.5 w-3.5 ml-auto" />}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
