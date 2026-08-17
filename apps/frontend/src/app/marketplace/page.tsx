'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { MarketplaceSearch } from '@/features/marketplace/components/MarketplaceSearch';
import { MarketplaceFilters } from '@/features/marketplace/components/MarketplaceFilters';
import { InterviewerCard } from '@/features/marketplace/components/InterviewerCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExperienceLevel } from '@interviewiq/shared';
import { NavHeader } from '@/components/NavHeader';
import Link from 'next/link';
import { Sparkles, ChevronLeft, ChevronRight, SearchX, Code2 } from 'lucide-react';

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | undefined>();
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sort, setSort] = useState('rating_desc');
  const [page, setPage] = useState(1);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInterviewers() {
      try {
        setLoading(true);
        const params: Record<string, any> = { page, limit: 12, sort };
        if (debouncedSearch) params.search = debouncedSearch;
        if (experienceLevel) params.experienceLevel = experienceLevel;
        if (minPrice) params.minPriceRupees = minPrice;
        if (maxPrice) params.maxPriceRupees = maxPrice;

        const res = await api.get('/marketplace/interviewers', { params });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch marketplace:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchInterviewers();
  }, [debouncedSearch, experienceLevel, minPrice, maxPrice, sort, page]);

  const resetFilters = () => {
    setSearch('');
    setExperienceLevel(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSort('rating_desc');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ─── Navigation Header ───────────────────────────────────── */}
      <NavHeader />

      <div className="container max-w-7xl py-10 px-4 space-y-8 flex-1">
      {/* Hero Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" /> Hand-picked Tech Experts & Engineers
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Book 1-on-1 Mock Interviews with <span className="text-gradient">Real Interviewers</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Practice coding, system design, and behavioral interviews with senior engineers from top tech companies.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <MarketplaceSearch value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1 sticky top-20">
          <MarketplaceFilters
            experienceLevel={experienceLevel}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
            onFilterChange={(filters) => {
              setExperienceLevel(filters.experienceLevel);
              setMinPrice(filters.minPrice);
              setMaxPrice(filters.maxPrice);
              setSort(filters.sort);
              setPage(1);
            }}
            onReset={resetFilters}
          />
        </aside>

        {/* Interviewers Grid */}
        <main className="lg:col-span-3 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : data?.data?.length === 0 ? (
            <div className="text-center py-16 space-y-4 border border-dashed rounded-xl p-8 bg-card/40">
              <SearchX className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">No interviewers found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Try adjusting your search query or filters to discover available interviewers.
              </p>
              <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data?.data?.map((interviewer: any) => (
                  <InterviewerCard
                    key={interviewer.id}
                    id={interviewer.id}
                    user={interviewer.user}
                    headline={interviewer.headline}
                    company={interviewer.company}
                    jobTitle={interviewer.jobTitle}
                    yearsOfExperience={interviewer.yearsOfExperience}
                    pricePerHour={interviewer.pricePerHour}
                    averageRating={interviewer.averageRating}
                    totalReviews={interviewer.totalReviews}
                    isVerified={interviewer.isVerified}
                    tags={interviewer.tags}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data?.meta && data.meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-border/40">
                  <p className="text-xs text-muted-foreground">
                    Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total interviewers)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.meta.hasPrev}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!data.meta.hasNext}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  </div>
  );
}
