# 🚀 MockMate — 1-on-1 Technical Mock Interview Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-4.19-lightgrey?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-5.17-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/WebRTC-LiveKit-green?style=for-the-badge&logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Groq_AI-LLaMA_3.3_70B-orange?style=for-the-badge" alt="Groq AI" />
</p>

---

## 📌 About MockMate

**MockMate** is a full-stack 1-on-1 technical mock interview platform connecting software engineering candidates with senior engineers for live coding, system design, and behavioral interview practice.

Candidates practice Data Structures & Algorithms, System Design, Frontend, Backend, and Behavioral interviews under authentic conditions with HD WebRTC video, a collaborative code editor, and AI-polished evaluation scorecards.

> **Note:** This is a portfolio project. Payments run in Razorpay **test mode** — no real money moves. The payment flow (order creation → client checkout → signature verification → webhook confirmation) is fully implemented and testable end-to-end.

---

## ✨ Key Features

### 👨‍💻 Candidate Experience
- **Interviewer Marketplace**: Filter senior engineers by target company, experience level, programming language, and hourly rate in ₹ (INR). Only admin-verified interviewers are listed.
- **Server-Enforced Slot Booking**: Bookable slots are generated from each interviewer's weekly availability minus booked sessions and blackouts — validated server-side, never trusted from the client.
- **MockMate Live Workspace**:
  - Sub-second HD WebRTC video and audio conferencing (powered by LiveKit).
  - Collaborative **Monaco Code Editor** (VS Code engine) with multi-language support (Python, JavaScript, TypeScript, C++, Java, Go, SQL) and real-time Socket.IO synchronization.
- **Early-Join Waiting Lobby**: Room tokens are issued at most 10 minutes before scheduled start, with a live countdown.
- **Actionable AI Scorecards**: Structured evaluation rubrics and personalized 4-week study roadmaps (Groq · LLaMA 3.3 70B), with a deterministic fallback if the AI call fails.

### 💼 Interviewer Experience
- **Role-Based Portal**: Dedicated Interviewer Dashboard (`/interviewer/dashboard`) with earnings, upcoming sessions, and payout breakdowns.
- **Availability & Blackouts Manager**: Weekly recurring slots plus one-time date & time range blackouts (vacations, holidays).
- **3-Step Onboarding Guide**: Interactive checklist for profile completion, hourly rate setup, and calendar configuration.

### 🛡️ Payments & Integrity (Razorpay test mode)
- **Order-Bound Verification**: every Razorpay order is bound to its booking at creation; verification only succeeds against that exact order — cross-booking signature reuse is impossible.
- **Webhook Source of Truth**: `payment.captured` / `payment.failed` webhooks verified via `x-razorpay-signature` HMAC over the raw body, so a closed tab never strands a payment.
- **Idempotency & Status Gates**: replayed verifications are no-ops; orders can't be created for paid/cancelled/expired bookings.
- **Payment Reservation TTL**: unpaid `PENDING` bookings expire after 15 minutes and release their slot.
- **Lifecycle Scheduler**: elapsed sessions are auto-`COMPLETED`, never-joined sessions become `NO_SHOW`, and LiveKit rooms are torn down on end.

### 📧 Notifications
- In-app notifications + transactional email (Resend) for booking confirmation, cancellation, feedback availability, and new reviews.

---

## 🏗️ Monorepo Architecture

```text
mockmate/
├── apps/
│   ├── frontend/         # Next.js 16 (App Router), TailwindCSS, Monaco Editor, Shadcn UI
│   └── backend/          # Node.js, Express, Prisma ORM, Socket.IO, LiveKit SDK, Groq AI
├── packages/
│   └── shared/           # Shared TypeScript types, enums, DTOs & validation schemas
├── .github/
│   └── workflows/        # GitHub Actions CI/CD pipeline
├── package.json          # Root workspace configuration
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, Monaco Editor, Lucide Icons |
| **Backend** | Express.js, Node.js, TypeScript, Socket.IO, Better Auth |
| **Database & ORM** | PostgreSQL (Supabase / local Docker), Prisma ORM |
| **Real-time Media** | LiveKit WebRTC (Audio & Video) |
| **AI Integration** | Groq API — LLaMA 3.3 70B (Feedback Scorecards & Study Roadmaps) |
| **Payments** | Razorpay (test mode) with webhook verification |
| **Email** | Resend (transactional notifications) |
| **CI/CD** | GitHub Actions Automated Pipeline |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: local Docker (compose file included) or any hosted instance

### 2. Clone the Repository
```bash
git clone https://github.com/utkarshboss1/Mockmate.git
cd Mockmate
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file inside `apps/backend/` (see `apps/backend/.env.example`):

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://mockmate:mockmate@localhost:5432/mockmate?schema=public
DIRECT_URL=postgresql://mockmate:mockmate@localhost:5432/mockmate?schema=public

# Storage mode: "database" for real persistence (recommended),
# "memory" for offline demo runs without a DB.
STORAGE_MODE=database

# WebRTC & Real-time
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your_livekit_domain.livekit.cloud

# AI Feedback
GROQ_API_KEY=your_groq_api_key

# Payments (Razorpay test mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 5. Start Local Infrastructure (optional)
```bash
docker compose up -d   # Postgres + Redis on localhost
```

### 6. Run Database Migration / Seed
```bash
# Generate Prisma Client
npm run db:generate --workspace=apps/backend

# Apply migrations
npm run db:migrate --workspace=apps/backend

# Seed sample data (interviewers, candidate, admin)
npm run db:seed --workspace=apps/backend
```

### 7. Start Local Development Servers
```bash
# Starts backend (port 4000); frontend: npm run dev:frontend
npm run dev:backend
```

Visit **`http://localhost:3000`** for the frontend, **`http://localhost:4000/health`** for the backend health check.

---

## 🧪 Verification & Type Checks

```bash
# Type check shared package
npm run type-check --workspace=packages/shared

# Type check backend
npm run type-check --workspace=apps/backend

# Type check frontend
npm run build --workspace=apps/frontend

# Run backend tests
npm run test --workspace=apps/backend
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  Built with ❤️ for software engineers aiming for top tech offers.
</p>