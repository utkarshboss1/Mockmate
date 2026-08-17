'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ExperienceLevel } from '@interviewiq/shared';
import { Filter, RotateCcw, IndianRupee } from 'lucide-react';

interface MarketplaceFiltersProps {
  experienceLevel?: ExperienceLevel;
  minPrice?: number;
  maxPrice?: number;
  sort: string;
  onFilterChange: (filters: {
    experienceLevel?: ExperienceLevel;
    minPrice?: number;
    maxPrice?: number;
    sort: string;
  }) => void;
  onReset: () => void;
}

export function MarketplaceFilters({
  experienceLevel,
  minPrice,
  maxPrice,
  sort,
  onFilterChange,
  onReset,
}: MarketplaceFiltersProps) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl">
      <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" /> Filters & Sort
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs text-muted-foreground">
          <RotateCcw className="h-3 w-3 mr-1" /> Reset
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Sort Order */}
        <div className="space-y-1.5">
          <Label className="text-xs">Sort By</Label>
          <Select value={sort} onValueChange={(val) => onFilterChange({ experienceLevel, minPrice, maxPrice, sort: val || 'rating_desc' })}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating_desc">Highest Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="experience_desc">Most Experienced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Level */}
        <div className="space-y-1.5">
          <Label className="text-xs">Experience Level</Label>
          <Select
            value={experienceLevel || 'all'}
            onValueChange={(val) => {
              const selected = val === 'all' ? undefined : (val as ExperienceLevel);
              onFilterChange({
                experienceLevel: selected,
                minPrice,
                maxPrice,
                sort,
              });
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="All experience levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Experience Levels</SelectItem>
              <SelectItem value={ExperienceLevel.JUNIOR}>Junior (1-2 yrs)</SelectItem>
              <SelectItem value={ExperienceLevel.MID}>Mid-Level (3-5 yrs)</SelectItem>
              <SelectItem value={ExperienceLevel.SENIOR}>Senior (5-8 yrs)</SelectItem>
              <SelectItem value={ExperienceLevel.STAFF}>Staff (8-12 yrs)</SelectItem>
              <SelectItem value={ExperienceLevel.PRINCIPAL}>Principal (12+ yrs)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range (in Rupees) */}
        <div className="space-y-1.5">
          <Label className="text-xs">Price Range (₹ / hr)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                placeholder="Min"
                value={minPrice || ''}
                onChange={(e) =>
                  onFilterChange({
                    experienceLevel,
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                    maxPrice,
                    sort,
                  })
                }
                className="h-8 text-xs pl-6"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
              <Input
                type="number"
                placeholder="Max"
                value={maxPrice || ''}
                onChange={(e) =>
                  onFilterChange({
                    experienceLevel,
                    minPrice,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                    sort,
                  })
                }
                className="h-8 text-xs pl-6"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
