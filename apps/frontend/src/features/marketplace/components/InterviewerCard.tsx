'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Briefcase, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency, getInitials } from '@/lib/utils';
import { Tag } from '@interviewiq/shared';

interface InterviewerCardProps {
  id: string;
  user: {
    name: string;
    avatar: string | null;
  };
  headline: string;
  company: string | null;
  jobTitle: string | null;
  yearsOfExperience: number;
  pricePerHour: number; // in paise
  averageRating: number;
  totalReviews: number;
  isVerified: boolean;
  tags: Tag[];
}

export function InterviewerCard({
  id,
  user,
  headline,
  company,
  jobTitle,
  yearsOfExperience,
  pricePerHour,
  averageRating,
  totalReviews,
  isVerified,
  tags,
}: InterviewerCardProps) {
  return (
    <Card className="flex flex-col justify-between border-border/50 bg-card/80 backdrop-blur-xl hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
            <AvatarImage src={user.avatar || undefined} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {user.name}
              </h3>
              {isVerified && (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate">
              {jobTitle || 'Engineer'}{company ? ` @ ${company}` : ''}
            </p>

            {/* Rating & Exp */}
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <div className="flex items-center text-amber-400 font-semibold">
                <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" />
                {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
                {totalReviews > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    ({totalReviews})
                  </span>
                )}
              </div>

              <div className="flex items-center text-muted-foreground">
                <Award className="h-3.5 w-3.5 mr-1" />
                {yearsOfExperience} yrs exp
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-2 space-y-3">
        {/* Headline */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {headline}
        </p>

        {/* Skill Tag Badges */}
        <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
          {tags.slice(0, 4).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-[10px] px-2 py-0.5 font-normal">
              {tag.name}
            </Badge>
          ))}
          {tags.length > 4 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
              +{tags.length - 4} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-3 border-t border-border/40 flex items-center justify-between mt-auto">
        <div>
          <span className="text-lg font-bold text-foreground">
            {formatCurrency(pricePerHour)}
          </span>
          <span className="text-xs text-muted-foreground"> / hour</span>
        </div>

        <Button asChild size="sm" className="gap-1 font-medium group/btn">
          <Link href={`/marketplace/${id}`}>
            Book Mock <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
