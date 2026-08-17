'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OverallRating } from '@interviewiq/shared';
import { getInitials } from '@/lib/utils';
import { Award, CheckCircle2, AlertTriangle, BookOpen, User } from 'lucide-react';

interface FeedbackViewProps {
  feedback: {
    overallRating: OverallRating;
    rawNotes: string;
    strengths: string[] | null;
    weaknesses: string[] | null;
    learningRecommendations: string[] | null;
    createdAt: string;
    booking: {
      interviewerProfile: {
        user: {
          name: string;
          avatar: string | null;
        };
      };
    };
  };
}

export function FeedbackView({ feedback }: FeedbackViewProps) {
  const interviewer = feedback.booking.interviewerProfile.user;

  const renderRecommendationBadge = (rating: OverallRating) => {
    switch (rating) {
      case OverallRating.STRONG_HIRE:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-sm px-3 py-1">Strong Hire</Badge>;
      case OverallRating.HIRE:
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-sm px-3 py-1">Hire</Badge>;
      case OverallRating.BORDERLINE:
        return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-sm px-3 py-1">Borderline</Badge>;
      case OverallRating.NO_HIRE:
      case OverallRating.STRONG_NO_HIRE:
        return <Badge variant="destructive" className="text-sm px-3 py-1">No Hire</Badge>;
      default:
        return <Badge variant="secondary">{rating}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Card */}
      <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-2xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shrink-0">
              <AvatarImage src={interviewer.avatar || undefined} alt={interviewer.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {getInitials(interviewer.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-bold">Mock Interview Evaluation</CardTitle>
              <CardDescription>Evaluated by {interviewer.name}</CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Verdict:</span>
            {renderRecommendationBadge(feedback.overallRating)}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Detailed Evaluation */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Detailed Evaluation Notes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-4 rounded-xl border border-border/40">
              {feedback.rawNotes}
            </p>
          </div>

          {/* Strengths */}
          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Key Strengths
              </h3>
              <ul className="space-y-1.5 pl-2">
                {feedback.strengths.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas for Improvement */}
          {feedback.weaknesses && feedback.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-4 w-4" /> Areas for Improvement
              </h3>
              <ul className="space-y-1.5 pl-2">
                {feedback.weaknesses.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Learning Recommendations */}
          {feedback.learningRecommendations && feedback.learningRecommendations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" /> Recommended Practice & Resources
              </h3>
              <ul className="space-y-1.5 pl-2">
                {feedback.learningRecommendations.map((item, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
