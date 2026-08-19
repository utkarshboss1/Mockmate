import Link from 'next/link';
import { NavHeader } from '@/components/NavHeader';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowRight,
  ArrowDown,
  Star,
  Video,
  Code2,
  BrainCircuit,
  ChevronRight,
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
      headline: 'Senior Software Engineer @ Google',
      company: 'Google',
      yearsOfExperience: 8,
      pricePerHourPaise: 120000,
      rating: 4.9,
      totalReviews: 48,
      tags: ['System Design', 'Algorithms', 'Distributed Systems'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'int_2',
      name: 'Alex Rivera',
      headline: 'Staff Engineer @ Meta',
      company: 'Meta',
      yearsOfExperience: 10,
      pricePerHourPaise: 150000,
      rating: 5.0,
      totalReviews: 62,
      tags: ['System Design', 'Scalability', 'Backend Architecture'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 'int_3',
      name: 'Priya Sharma',
      headline: 'Senior UI Architect @ Microsoft',
      company: 'Microsoft',
      yearsOfExperience: 7,
      pricePerHourPaise: 100000,
      rating: 4.8,
      totalReviews: 35,
      tags: ['Frontend Architecture', 'JavaScript', 'Web Performance'],
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <NavHeader />

      {/* ═══════════════════════════════════════════════════════════
          HERO — Full-viewport, bold editorial typography
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-16 lg:px-24">
        {/* Uppercase label */}
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-8">
          Mock Interview Platform · India
        </p>

        {/* Massive heading */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-extrabold leading-[0.95] tracking-[-0.03em] max-w-5xl font-heading">
          Practice interviews{' '}
          <br className="hidden md:block" />
          with{' '}
          <span className="text-primary italic">real engineers.</span>
        </h1>

        {/* Subdued body */}
        <p className="text-sm md:text-base text-muted-foreground max-w-md mt-10 leading-relaxed">
          Book 1-on-1 sessions with senior engineers from
          Google, Meta, Amazon and Microsoft. Live coding,
          system design, and actionable scorecards.
        </p>

        {/* Scroll indicator — bottom right */}
        <div className="absolute bottom-10 right-8 md:right-16 flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
          <span>Scroll</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </div>

        {/* Subtle CTAs */}
        <div className="flex items-center gap-6 mt-12">
          <Link
            href="/marketplace"
            className="group flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            Find an Interviewer
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/register?role=interviewer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Join as Interviewer
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR — Minimal horizontal strip
          ═══════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/[0.04] py-10 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Verified Interviewers' },
            { value: '10,000+', label: 'Sessions Conducted' },
            { value: '4.9 / 5', label: 'Average Rating' },
            { value: '₹500+', label: 'Starting Rate / hr' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 tracking-wide uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT WORKS — Numbered steps with dividers
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1] mb-16">
            From booking to{' '}
            <span className="text-primary">feedback</span> in four steps.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
            {[
              {
                num: '01',
                title: 'Select an Engineer',
                desc: 'Browse by company, expertise, experience level, and hourly rate.',
              },
              {
                num: '02',
                title: 'Pick a Time Slot',
                desc: 'Reserve a 60-minute window directly on their live calendar.',
              },
              {
                num: '03',
                title: 'Live 1-on-1 Session',
                desc: 'Join the video room with a shared Monaco code editor workspace.',
              },
              {
                num: '04',
                title: 'Get Your Scorecard',
                desc: 'Receive structured rubrics and personalized improvement notes.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="border-t border-white/[0.06] pt-6 pb-8 lg:pr-10"
              >
                <div className="text-[11px] font-mono font-medium text-primary tracking-wider mb-4">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES — Three-column with thin top borders
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Platform
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl leading-[1.1] mb-16">
            Built for focused{' '}
            <span className="text-primary">technical prep.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            {[
              {
                icon: <Video className="h-5 w-5" />,
                title: 'Live WebRTC Video',
                desc: 'Reliable audio and video with mic, camera, and screen sharing. Powered by LiveKit.',
              },
              {
                icon: <Code2 className="h-5 w-5" />,
                title: 'Monaco Code Editor',
                desc: 'VS Code engine supporting Python, JS, TS, C++, Java, Go, and SQL with real-time sync.',
              },
              {
                icon: <BrainCircuit className="h-5 w-5" />,
                title: 'Structured Scorecards',
                desc: 'Evaluation rubrics covering code quality, problem solving, time complexity, and communication.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="border-t border-white/[0.06] pt-6 pb-8 md:pr-10"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          INTERVIEWERS — Horizontal cards with images
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-14">
            <div>
              <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground mb-4">
                Top Rated
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                Featured{' '}
                <span className="text-primary">interviewers.</span>
              </h2>
            </div>

            <Link
              href="/marketplace"
              className="group flex items-center gap-1.5 text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              View All <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredInterviewers.map((int) => (
              <Link
                key={int.id}
                href={`/book/${int.id}`}
                className="group block"
              >
                {/* Image */}
                <div className="aspect-[4/3] rounded-lg overflow-hidden mb-4 bg-card">
                  <img
                    src={int.avatar}
                    alt={int.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {int.name}
                    </h4>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {int.headline}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-semibold text-foreground">{int.rating}</span>
                      <span>({int.totalReviews} reviews)</span>
                      <span className="mx-1.5 text-white/10">|</span>
                      <span>{int.yearsOfExperience} yrs</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-primary">
                      {formatCurrency(int.pricePerHourPaise)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">/hour</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA — Single bold line
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 md:px-16 lg:px-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl">
            Ready to practice for your next{' '}
            <span className="text-primary italic">interview?</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-6 max-w-md leading-relaxed">
            Book a 1-on-1 session with senior engineers and get real
            feedback on your coding and communication skills.
          </p>
          <div className="flex items-center gap-6 mt-10">
            <Link
              href="/register"
              className="group flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              Get Started with MockMate
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/marketplace"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Interviewers
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER — Ultra minimal
          ═══════════════════════════════════════════════════════════ */}
      <footer className="mt-auto border-t border-white/[0.04] py-8 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <div>
            <span className="font-bold text-foreground">MockMate</span>
            {' '}© {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-8 tracking-[0.1em] uppercase font-medium">
            <Link href="/marketplace" className="hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
