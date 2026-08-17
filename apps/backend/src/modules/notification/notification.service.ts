// ============================================================
// notification.service.ts — Notification & Email Business Logic
// ============================================================

import { notificationRepository, NotificationRepository } from './notification.repository';
import { sendEmail } from '../../lib/email';
import { NotificationType } from '@interviewiq/shared';

export class NotificationService {
  constructor(private repository: NotificationRepository) {}

  async getUserNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.repository.getUserNotifications(userId),
      this.repository.getUnreadCount(userId),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    return this.repository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.repository.markAllAsRead(userId);
  }

  async notifyBookingConfirmed(data: {
    candidateId: string;
    candidateEmail: string;
    interviewerUserId: string;
    interviewerEmail: string;
    interviewerName: string;
    candidateName: string;
    scheduledAt: string;
    bookingId: string;
  }) {
    // 1. Create In-App Notifications
    await Promise.all([
      this.repository.createNotification({
        userId: data.candidateId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'Mock Interview Confirmed!',
        message: `Your interview with ${data.interviewerName} is scheduled for ${new Date(data.scheduledAt).toLocaleString()}.`,
        linkUrl: `/dashboard`,
      }),
      this.repository.createNotification({
        userId: data.interviewerUserId,
        type: NotificationType.BOOKING_CONFIRMED,
        title: 'New Session Booked!',
        message: `${data.candidateName} has booked a mock interview with you for ${new Date(data.scheduledAt).toLocaleString()}.`,
        linkUrl: `/interviewer/dashboard`,
      }),
    ]);

    // 2. Trigger Non-blocking Transactional Emails
    void sendEmail({
      to: data.candidateEmail,
      subject: 'InterviewIQ — Mock Session Confirmed',
      html: `<h2>Mock Interview Confirmed</h2><p>Your session with <strong>${data.interviewerName}</strong> is confirmed for ${new Date(data.scheduledAt).toLocaleString()}.</p>`,
    });

    void sendEmail({
      to: data.interviewerEmail,
      subject: 'InterviewIQ — New Mock Interview Booked',
      html: `<h2>New Session Booked</h2><p>Candidate <strong>${data.candidateName}</strong> booked a session with you for ${new Date(data.scheduledAt).toLocaleString()}.</p>`,
    });
  }

  async notifyFeedbackSubmitted(data: {
    candidateId: string;
    candidateEmail: string;
    interviewerName: string;
    bookingId: string;
  }) {
    // 1. In-App Notification
    await this.repository.createNotification({
      userId: data.candidateId,
      type: NotificationType.FEEDBACK_AVAILABLE,
      title: 'Interview Evaluation Ready',
      message: `${data.interviewerName} has submitted your detailed mock interview feedback scorecard.`,
      linkUrl: `/feedback/${data.bookingId}`,
    });

    // 2. Email Notification
    void sendEmail({
      to: data.candidateEmail,
      subject: 'InterviewIQ — Your Interview Feedback is Ready',
      html: `<h2>Feedback Scorecard Ready</h2><p>Your detailed evaluation from <strong>${data.interviewerName}</strong> is now available.</p>`,
    });
  }
}

export const notificationService = new NotificationService(notificationRepository);
