'use client';

import { useState } from 'react';
import { api, getErrorMessage } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, Target, Calendar, Lightbulb, CheckCircle2 } from 'lucide-react';

export function PrepAdvisorWidget() {
  const [targetRole, setTargetRole] = useState('Senior Full Stack Engineer');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<any | null>(null);

  const handleGenerateRoadmap = async () => {
    if (!targetRole.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/ai/prep-advisor', {
        targetRole,
        targetCompany: targetCompany.trim() || undefined,
      });

      setRoadmap(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-transparent border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" /> AI Interview Prep Advisor
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] font-mono uppercase">
            Powered by Groq · LLaMA 3.3 70B
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Get a personalized 4-week preparation plan based on your target role and past mock performance.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="targetRole" className="text-xs">Target Job Role *</Label>
            <Input
              id="targetRole"
              placeholder="e.g. Senior Backend Engineer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetCompany" className="text-xs">Target Company (Optional)</Label>
            <Input
              id="targetCompany"
              placeholder="e.g. Google, Amazon, Microsoft"
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerateRoadmap}
          disabled={loading || !targetRole.trim()}
          className="w-full font-semibold gap-2 text-xs glow-primary"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
          {loading ? 'Analyzing Scorecards & Generating Plan...' : 'Generate Personalized 4-Week Roadmap'}
        </Button>

        {/* Generated Roadmap Display */}
        {roadmap && (
          <div className="space-y-6 pt-4 border-t border-border/40 animate-fade-in">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> 4-Week Study Plan for {roadmap.targetRole}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roadmap.weeklyPlan?.map((weekObj: any) => (
                <div key={weekObj.week} className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">Week {weekObj.week}</span>
                    <Badge variant="outline" className="text-[10px]">{weekObj.focus}</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {weekObj.tasks?.map((task: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Strategy Tips */}
            {roadmap.topStrategyTips && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <h4 className="font-semibold text-xs flex items-center gap-1.5 text-primary">
                  <Lightbulb className="h-4 w-4" /> Strategic Interview Tips
                </h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {roadmap.topStrategyTips.map((tip: string, i: number) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
