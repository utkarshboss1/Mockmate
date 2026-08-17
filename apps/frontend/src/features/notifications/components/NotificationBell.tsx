'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, CheckCheck, Sparkles } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 border-border/50 bg-card/95 backdrop-blur-xl">
        <div className="flex items-center justify-between p-3 border-b border-border/40">
          <span className="font-semibold text-xs flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Notifications
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border/30">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 text-xs space-y-1 transition-colors ${
                  !n.isRead ? 'bg-primary/5' : 'hover:bg-accent/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(n.createdAt)}</span>
                </div>
                <p className="text-muted-foreground leading-snug">{n.message}</p>
                {n.metadata?.linkUrl && (
                  <Link
                    href={n.metadata.linkUrl}
                    onClick={() => setOpen(false)}
                    className="inline-block text-[11px] text-primary font-medium hover:underline pt-1"
                  >
                    View Details →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
