'use client';

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface MarketplaceSearchProps {
  value: string;
  onChange: (val: string) => void;
}

export function MarketplaceSearch({ value, onChange }: MarketplaceSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search interviewers by name, company, topic (e.g. Google, System Design)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 h-11 bg-card/80 backdrop-blur-md border-border/60 focus-visible:ring-primary"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
