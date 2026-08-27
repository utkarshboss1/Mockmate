import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { NavigationWrapper } from '@/components/NavigationWrapper';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MockMate — 1-on-1 Mock Interviews with FAANG Experts',
    template: '%s | MockMate',
  },
  description:
    'Book 1-on-1 technical mock interviews with experienced engineers from top companies. Live WebRTC video, Monaco code editor, and actionable scorecards.',
  keywords: [
    'mock interview',
    'MockMate',
    'software engineering interview',
    'coding interview prep',
    'technical interview',
    'system design interview',
    'interview practice',
  ],
  authors: [{ name: 'MockMate' }],
  creator: 'MockMate',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'MockMate — 1-on-1 Mock Interviews with Real Experts',
    description:
      'Book 1-on-1 mock interviews with experienced engineers. Get real feedback, improve faster.',
    siteName: 'MockMate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MockMate',
    description: 'Mock interviews with real FAANG engineers.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F0F23' },
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground tracking-tight selection:bg-primary/25 selection:text-foreground flex flex-col min-h-screen`}>
        <AuthProvider>
          <NavigationWrapper />
          <div className="flex-1">
            {children}
          </div>
        </AuthProvider>
        <Toaster position="top-center" richColors />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
