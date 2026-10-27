// ============================================================
// notification.repository.ts — Database Access for Notifications
// ============================================================

import { prisma } from '../../lib/prisma';
import { isMockStorage } from '../../mockStore/mode';
import { NotificationType } from '@interviewiq/shared';

export class NotificationRepository {
  async getUserNotifications(userId: string) {
    if (isMockStorage()) return [];

    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getUnreadCount(userId: string) {
    if (isMockStorage()) return 0;

    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    linkUrl?: string;
  }) {
    if (isMockStorage()) {
      return {
        id: `notif_${Date.now()}`,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
        createdAt: new Date(),
      } as any;
    }

    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.linkUrl ? { linkUrl: data.linkUrl } : undefined,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    if (isMockStorage()) return { count: 1 };

    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    if (isMockStorage()) return { count: 0 };

    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
