// ============================================================
// InterviewIQ — Shared Types
// Consumed by both apps/backend and apps/frontend
// ============================================================

// ─── User & Auth ────────────────────────────────────────────

export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  INTERVIEWER = 'INTERVIEWER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Interviewer Profile ─────────────────────────────────────

export enum ExperienceLevel {
  JUNIOR = 'JUNIOR',
  MID = 'MID',
  SENIOR = 'SENIOR',
  STAFF = 'STAFF',
  PRINCIPAL = 'PRINCIPAL',
}

export interface InterviewerProfile {
  id: string;
  userId: string;
  headline: string;
  bio: string;
  company: string | null;
  jobTitle: string | null;
  yearsOfExperience: number;
  experienceLevel: ExperienceLevel;
  pricePerHour: number; // in paise (INR minor units)
  linkedinUrl: string | null;
  githubUrl: string | null;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  totalInterviews: number;
  tags: Tag[];
  user: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ─── Tags ────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

// ─── Availability ────────────────────────────────────────────

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export interface AvailabilitySlot {
  id: string;
  interviewerProfileId: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" in UTC
  endTime: string;   // "HH:MM" in UTC
  isActive: boolean;
}

// ─── Booking ─────────────────────────────────────────────────

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED_BY_CANDIDATE = 'CANCELLED_BY_CANDIDATE',
  CANCELLED_BY_INTERVIEWER = 'CANCELLED_BY_INTERVIEWER',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
}

export enum InterviewType {
  TECHNICAL_CODING = 'TECHNICAL_CODING',
  SYSTEM_DESIGN = 'SYSTEM_DESIGN',
  BEHAVIORAL = 'BEHAVIORAL',
  RESUME_REVIEW = 'RESUME_REVIEW',
  MOCK_FULL = 'MOCK_FULL',
}

export interface Booking {
  id: string;
  candidateId: string;
  interviewerProfileId: string;
  scheduledAt: string; // ISO 8601
  durationMinutes: number;
  interviewType: InterviewType;
  status: BookingStatus;
  totalAmountPaise: number;
  platformFeePaise: number;
  interviewerPayoutPaise: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Interview Room ───────────────────────────────────────────

export enum InterviewStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
}

export interface Interview {
  id: string;
  bookingId: string;
  status: InterviewStatus;
  startedAt: string | null;
  endedAt: string | null;
  roomToken: string | null;
}

// ─── Feedback ────────────────────────────────────────────────

export enum OverallRating {
  STRONG_HIRE = 'STRONG_HIRE',
  HIRE = 'HIRE',
  BORDERLINE = 'BORDERLINE',
  NO_HIRE = 'NO_HIRE',
  STRONG_NO_HIRE = 'STRONG_NO_HIRE',
}

export interface Feedback {
  id: string;
  bookingId: string;
  interviewerProfileId: string;
  candidateId: string;
  rawNotes: string;
  overallRating: OverallRating;
  // AI-generated fields
  professionalSummary: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  learningRecommendations: string[] | null;
  isSharedWithCandidate: boolean;
  createdAt: string;
}

// ─── Review ──────────────────────────────────────────────────

export interface Review {
  id: string;
  bookingId: string;
  candidateId: string;
  interviewerProfileId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: string;
}

// ─── Payment ─────────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export interface Payment {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  amountPaise: number;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  INTERVIEW_STARTING = 'INTERVIEW_STARTING',
  FEEDBACK_AVAILABLE = 'FEEDBACK_AVAILABLE',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Resume ───────────────────────────────────────────────────

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  createdAt: string;
}

export interface ResumeAnalysis {
  id: string;
  resumeId: string;
  extractedSkills: string[];
  improvements: string[];
  predictedQuestions: string[];
  overallScore: number; // 0-100
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  message?: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ─── Socket.IO Events ─────────────────────────────────────────

export enum SocketEvent {
  // Connection
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  PARTICIPANT_JOINED = 'participant_joined',
  PARTICIPANT_LEFT = 'participant_left',

  // Chat
  SEND_MESSAGE = 'send_message',
  RECEIVE_MESSAGE = 'receive_message',
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',

  // Code Editor
  CODE_CHANGE = 'code_change',
  LANGUAGE_CHANGE = 'language_change',

  // Interview Control
  TIMER_SYNC = 'timer_sync',
  INTERVIEW_STARTED = 'interview_started',
  INTERVIEW_ENDED = 'interview_ended',

  // Errors
  ERROR = 'error',
}

export interface ChatMessage {
  id: string;
  interviewId: string;
  senderId: string;
  senderName: string;
  content: string;
  sentAt: string;
}

export interface CodeChangePayload {
  interviewId: string;
  content: string;
  language: string;
  senderId: string;
}

export interface TimerSyncPayload {
  interviewId: string;
  elapsedSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
}
