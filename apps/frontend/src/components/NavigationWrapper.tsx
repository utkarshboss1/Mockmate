'use client';

import { usePathname } from 'next/navigation';
import { NavHeader } from '@/components/NavHeader';

export function NavigationWrapper() {
  const pathname = usePathname();

  // The active LiveKit interview room uses a dedicated full-screen editor layout
  if (pathname?.startsWith('/interview/')) {
    return null;
  }

  return <NavHeader />;
}
