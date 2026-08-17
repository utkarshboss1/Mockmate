import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { NavHeader } from '@/components/NavHeader';
import { formatCurrency } from '@/lib/utils';
import {
  Video,
  Code2,
  BrainCircuit,
  ArrowRight,
  Star,
  Users,
  CheckCircle2,
  Award,
  Calendar,
  Clock,
  IndianRupee,
  Briefcase,
  ChevronRight,
  User,
  Shield,
} from 'lucide-react';

export const metadata = {
  title: 'MockMate — Practice Technical Interviews with Senior FAANG Engineers',
  description:
    '1-on-1 mock interviews in coding, system design, and behavioral with experienced engineers from Google, Meta, Amazon, and Microsoft.',
};

export default function HomePage() {
  const featuredInterviewers = [
    {
      id: 'int_1',
      name: 'Sarah Chen',
      headline: 'Senior Software Engineer @ Google | Ex-Amazon',
      company: 'Google',
      jobTitle: 'Senior Software Engineer',
      yearsOfExperience: 8,
      pricePerHourPaise: 120000, // ₹1,200
      rating: 4.9,
      totalReviews: 48,
      tags: ['System Design', 'Algorithms', 'Distributed Systems'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'int_2',
      name: 'Alex Rivera',
      headline: 'Staff Engineer @ Meta | System Design Lead',
      company: 'Meta',
      jobTitle: 'Staff Software Engineer',
      yearsOfExperience: 10,
      pricePerHourPaise: 150000, // ₹1,500
      rating: 5.0,
      totalReviews: 62,
      tags: ['System Design', 'Scalability', 'Backend Architecture'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'int_3',
      name: 'Priya Sharma',
      headline: 'Senior UI Architect @ Microsoft | React Specialist',
      company: 'Microsoft',
      jobTitle: 'Senior UI Architect',
      yearsOfExperience: 7,
      pricePerHourPaise: 100000, // ₹1,000
      rating: 4.8,
      totalReviews: 35,
      tags: ['Frontend Architecture', 'JavaScript', 'Web Performance'],
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navigation Header */}
      <NavHeader />

      {/* ─── Soothing Hero Section ────────────────────────────────── */}
      <section className="relative py-16 md:py-28 overflow-hidden border-b border-border/40 bg-card/20">
        <div className="container max-w-5xl text-center space-y-7 relative z-10 px-4">
          <Badge
            variant="outline"
            className="px-3.5 py-1 text-xs font-medium rounded-full border-border/60 bg-secondary/50 text-muted-foreground inline-flex items-center gap-2"
          >
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>1-on-1 Peer & Expert Mock Interviews</span>
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.15] max-w-4xl mx-auto font-heading">
            Practice Technical Interviews with{' '}
            <span className="text-foreground border-b-2 border-primary/60 pb-1">Real FAANG Engineers</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect 1-on-1 with verified senior engineers for live coding, system design, and behavioral practice with actionable scorecards.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/marketplace" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold gap-2 text-xs h-12 px-7 rounded-xl shadow-md">
                Find an Interviewer <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register?role=interviewer" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium text-xs h-12 px-7 rounded-xl border-border/60 bg-card/40">
                <Briefcase className="h-4 w-4 text-primary mr-1.5" /> Join as an Interviewer (Earn in ₹)
              </Button>
            </Link>
          </div>

          {/* Clean Real Workspace Preview Mockup */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden p-1.5">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-t-xl border-b border-border/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-600 inline-block" />
                  <span className="font-mono text-muted-foreground ml-2">MockMate Live Workspace — 60-min Practice Session</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-secondary/80 border-border/60 text-muted-foreground font-mono">
                  Live WebRTC Session
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-[#11161F] rounded-b-xl min-h-[240px] text-left">
                {/* Code Editor Preview */}
                <div className="md:col-span-8 p-4 rounded-xl bg-[#161B22] border border-white/5 font-mono text-xs text-slate-300 space-y-2">
                  <div className="text-slate-500">// Problem: Lowest Common Ancestor of a Binary Search Tree</div>
                  <div><span className="text-blue-400">def</span> <span className="text-emerald-400">lowestCommonAncestor</span>(root: TreeNode, p: TreeNode, q: TreeNode) -&gt; TreeNode:</div>
                  <div className="pl-4 text-slate-400">curr = root</div>
                  <div className="pl-4 text-slate-400"><span className="text-blue-400">while</span> curr:</div>
                  <div className="pl-8 text-slate-400"><span className="text-blue-400">if</span> p.val &gt; curr.val <span className="text-blue-400">and</span> q.val &gt; curr.val:</div>
                  <div className="pl-12 text-slate-400">curr = curr.right</div>
                  <div className="pl-8 text-slate-400"><span className="text-blue-400">elif</span> p.val &lt; curr.val <span className="text-blue-400">and</span> q.val &lt; curr.val:</div>
                  <div className="pl-12 text-slate-400">curr = curr.left</div>
                  <div className="pl-8 text-slate-400"><span className="text-blue-400">else</span>: <span className="text-blue-400">return</span> curr</div>
                </div>

                {/* Video & Scorecard Panel Preview */}
                <div className="md:col-span-4 flex flex-col gap-2.5">
                  <div className="flex-1 rounded-xl bg-[#161B22] border border-white/5 p-3 flex flex-col items-center justify-center text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-bold">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Google Senior Engineer</span>
                    <span className="text-[10px] text-muted-foreground">Active Mic & Video</span>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border/50 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Session Scorecard
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Strong algorithmic efficiency. Great explanation of space complexity constraints.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Metric Cards */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm text-center">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Verified Interviewers</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm text-center">
              <div className="text-2xl font-bold text-foreground">10,000+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Sessions Conducted</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm text-center">
              <div className="text-2xl font-bold text-emerald-400">4.9 / 5.0</div>
              <div className="text-xs text-muted-foreground mt-0.5">Average Candidate Rating</div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm text-center">
              <div className="text-2xl font-bold text-primary">₹ 500+</div>
              <div className="text-xs text-muted-foreground mt-0.5">Starting Rate per Hour</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Categories ───────────────────────────────── */}
      <section className="py-10 border-b border-border/40 bg-card/10">
        <div className="container max-w-5xl text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter Practice Sessions by Topic & Role
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              'Data Structures & Algorithms',
              'System Design & Architecture',
              'Frontend (React, TypeScript)',
              'Backend & Microservices',
              'AI & ML Engineering',
              'Behavioral & Leadership',
              'SQL & Database Optimization',
            ].map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border-border/60 bg-card hover:border-primary/40 transition-colors cursor-pointer"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Simple 4-Step Process ──────────────────────────────── */}
      <section className="py-20 container max-w-5xl space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">How MockMate Works</h2>
          <p className="text-xs text-muted-foreground">
            Clear, transparent steps to practice under realistic interview conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="border-border/50 bg-card p-5 space-y-3">
            <div className="text-xs font-bold text-primary uppercase font-mono">Step 01</div>
            <h3 className="text-sm font-bold">Select an Engineer</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Find senior interviewers by target company, experience level, and rate in ₹.
            </p>
          </Card>

          <Card className="border-border/50 bg-card p-5 space-y-3">
            <div className="text-xs font-bold text-primary uppercase font-mono">Step 02</div>
            <h3 className="text-sm font-bold">Pick a Time Slot</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Book a 60-minute window directly on the interviewer's live schedule.
            </p>
          </Card>

          <Card className="border-border/50 bg-card p-5 space-y-3">
            <div className="text-xs font-bold text-primary uppercase font-mono">Step 03</div>
            <h3 className="text-sm font-bold">Live 1-on-1 Practice</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Join the video room with Monaco code editor and shared technical workspace.
            </p>
          </Card>

          <Card className="border-border/50 bg-card p-5 space-y-3">
            <div className="text-xs font-bold text-primary uppercase font-mono">Step 04</div>
            <h3 className="text-sm font-bold">Actionable Feedback</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receive structured rating rubrics and personalized improvement notes.
            </p>
          </Card>
        </div>
      </section>

      {/* ─── Platform Features Grid ──────────────────────────────── */}
      <section className="py-20 bg-card/30 border-y border-border/40">
        <div className="container max-w-5xl space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Built for Focused Technical Prep</h2>
            <p className="text-xs text-muted-foreground">
              Everything needed for realistic 60-minute mock interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Video className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Live WebRTC Video</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reliable WebRTC audio and video conferencing with mic, camera, and screen sharing controls.
              </p>
            </Card>

            <Card className="border-border/50 bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Monaco Code Workspace</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                VS Code powered interactive editor supporting Python, JS, TS, C++, Java, Go, and SQL with real-time sync.
              </p>
            </Card>

            <Card className="border-border/50 bg-card p-6 space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold">Structured Scorecards</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comprehensive evaluation rubrics covering code quality, problem solving, time complexity, and communication.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Featured Interviewers Showcase ──────────────────────── */}
      <section className="py-20 container max-w-5xl space-y-10 px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Top-Rated Interviewers</h2>
            <p className="text-xs text-muted-foreground">Book 1-on-1 sessions with experienced engineers.</p>
          </div>

          <Button asChild variant="outline" size="sm" className="text-xs font-medium gap-1.5 border-border/60">
            <Link href="/marketplace">
              View All Interviewers <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredInterviewers.map((int) => (
            <Card key={int.id} className="border-border/50 bg-card flex flex-col justify-between p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={int.avatar}
                    alt={int.name}
                    className="w-11 h-11 rounded-full object-cover border border-border"
                  />
                  <div>
                    <h4 className="font-bold text-sm">{int.name}</h4>
                    <p className="text-[11px] text-muted-foreground">{int.headline}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{int.rating}</span>
                    <span className="text-muted-foreground font-normal">({int.totalReviews})</span>
                  </div>
                  <div>{int.yearsOfExperience} yrs exp</div>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {int.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] bg-secondary/80 font-normal">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 mt-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-muted-foreground">Hourly Rate</div>
                  <div className="text-base font-bold text-primary">{formatCurrency(int.pricePerHourPaise)}/hr</div>
                </div>

                <Button asChild size="sm" className="font-semibold text-xs">
                  <Link href={`/book/${int.id}`}>Book Session</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ─── Call to Action Banner ────────────────────────────────── */}
      <section className="py-16 container max-w-5xl px-4">
        <Card className="border-border/60 bg-card p-8 md:p-12 text-center space-y-5 shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight max-w-xl mx-auto">
            Ready to Practice for Your Next Interview?
          </h2>

          <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Book a 1-on-1 session with senior engineers and get real feedback on your coding and communication skills.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/register">
              <Button size="lg" className="font-semibold text-xs h-11 px-7 rounded-xl">
                Get Started with MockMate <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline" size="lg" className="font-medium text-xs h-11 px-7 rounded-xl border-border/60">
                Browse Interviewers
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/40 bg-card/40 py-8">
        <div className="container max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground px-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">MockMate</span> © {new Date().getFullYear()} — All rights reserved.
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
