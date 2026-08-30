# Product Context

## Purpose
MockMate is a 1-on-1 technical mock interview platform connecting software engineering candidates with senior engineers from top tech companies (Google, Meta, Amazon, Microsoft) for live coding, system design, and behavioral interview prep.

## Target Audience
- **Software Engineers & Tech Candidates**: Preparing for technical interviews (DSA, System Design, Behavioral) to land offers at tier-1/FAANG companies.
- **Senior Engineers & Interviewers**: Verified practitioners offering mock interviews, structured feedback rubrics, and mentorship.

## Key Capabilities
- **Marketplace**: Search and filter interviewers by company, experience, topic, and hourly rate.
- **Scheduling**: Calendar slot selection with blackout and availability management.
- **Live Interview Room**: WebRTC video powered by LiveKit + real-time Monaco Code Editor (VS Code engine).
- **Evaluation Scorecards**: Actionable rubrics and feedback scorecards across problem solving, time complexity, and communication.
- **Payments**: Razorpay test payment integration + Paddle-style tiered subscription passes.
- **Early-Join Waiting Lobby**: Prevents room entry until 10 minutes prior to scheduled session time with real-time countdown clock.

## Platform & Stack
- **Platform**: Web (Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4)
- **Backend**: Express.js + Socket.IO + Prisma ORM + PostgreSQL (Supabase) + Razorpay
- **Audio/Video**: LiveKit Cloud WebRTC
