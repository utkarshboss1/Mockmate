# 🚀 MockMate — 1-on-1 Technical Mock Interview Platform

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-4.19-lightgrey?style=for-the-badge&logo=express" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-5.17-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/WebRTC-LiveKit-green?style=for-the-badge&logo=webrtc" alt="WebRTC" />
  <img src="https://img.shields.io/badge/Gemini_AI-Google-orange?style=for-the-badge&logo=google" alt="Gemini AI" />
</p>

---

## 📌 About MockMate

**MockMate** is a full-stack, enterprise-grade 1-on-1 technical mock interview platform connecting software engineering candidates with verified senior engineers from top tech companies (Google, Meta, Amazon, Microsoft).

Candidates can practice Data Structures & Algorithms, System Design, Frontend, Backend, and Behavioral interviews under authentic conditions with HD WebRTC video, collaborative code editing, and AI-powered scorecards.

---

## ✨ Key Features

### 👨‍💻 Candidate Experience
- **Interviewer Marketplace**: Filter senior engineers by target company, experience level, programming language, and hourly rate in ₹ (INR).
- **Interactive Booking Calendar**: Select 60-minute time slots directly on an interviewer's live schedule.
- **MockMate Live Workspace**:
  - Sub-second HD WebRTC video and audio conferencing (powered by LiveKit).
  - Collaborative **Monaco Code Editor** (VS Code engine) with multi-language support (Python, JavaScript, TypeScript, C++, Java, Go, SQL) and real-time Socket.IO synchronization.
- **Actionable AI Scorecards**: Receive structured evaluation rubrics and Google Gemini AI 4-week study roadmaps after every session.

### 💼 Interviewer Experience
- **Role-Based Portal**: Dedicated Interviewer Dashboard (`/interviewer/dashboard`) with earnings, upcoming sessions, and payout controls.
- **Availability & Blackouts Manager**: Set weekly recurring slots alongside one-time date & time range blackouts (vacations, holidays).
- **Zero-Based New Account Payouts**: Newly registered interviewers start with ₹0 earnings and 0 sessions for complete data integrity.
- **3-Step Onboarding Guide**: Interactive onboarding checklist to guide new experts through profile completion, hourly rate setup, and calendar configuration.

---

## 🏗️ Monorepo Architecture

MockMate is organized as a high-performance **npm workspace monorepo**:

```text
mockmate/
├── apps/
│   ├── frontend/         # Next.js 16 (App Router), TailwindCSS, Monaco Editor, Shadcn UI
│   └── backend/          # Node.js, Express, Prisma ORM, Socket.IO, LiveKit SDK, Gemini AI
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
| **Database & ORM** | PostgreSQL (Supabase), Prisma ORM |
| **Real-time Media** | LiveKit WebRTC (Audio & Video) |
| **AI Integration** | Google Gemini API (Personalized Scorecards & Study Roadmaps) |
| **Payments** | Stripe Integration (Pricing formatted in ₹ INR) |
| **CI/CD** | GitHub Actions Automated Pipeline |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher

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
Create a `.env` file inside `apps/backend/.env`:

```env
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/mockmate?sslmode=require
DIRECT_URL=postgresql://user:password@host:5432/mockmate?sslmode=require

# WebRTC & Real-time
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your_livekit_domain.livekit.cloud

# AI Feedback
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run Database Migration / Seed
```bash
# Generate Prisma Client
npm run db:generate --workspace=apps/backend

# Push schema to database (optional)
npm run db:push --workspace=apps/backend
```

### 6. Start Local Development Servers
```bash
# Starts both frontend (port 3000) and backend (port 4000) concurrently
npm run dev
```

Visit **`http://localhost:3000`** in your browser to explore MockMate!

---

## 🧪 Verification & Type Checks

```bash
# Type check shared package
npm run type-check --workspace=packages/shared

# Type check backend
npm run type-check --workspace=apps/backend

# Type check frontend
npm run type-check --workspace=apps/frontend

# Build Next.js production app
npm run build --workspace=apps/frontend
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.

---

<p align="center">
  Built with ❤️ for software engineers aiming for top tech offers.
</p>
