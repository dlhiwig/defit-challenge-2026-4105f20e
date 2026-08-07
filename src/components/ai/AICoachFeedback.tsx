import { useState } from 'react';
import { Loader2, Sparkles, Target, TrendingUp, TriangleAlert, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Feedback {
  headline: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  nextSteps: { pillar: string; action: string; target: string }[];
  weekAheadPlan: string[];
}

export function AICoachFeedback() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-workout-feedback', {
        body: { days: 28 },
      });
      if (fnError) {
        let message = fnError.message;
        if (fnError instanceof FunctionsHttpError) {
          const body = await fnError.context.json().catch(() => null);
          message = body?.error ?? message;
        }
        throw new Error(message);
      }
      setFeedback(data.feedback as Feedback);
      setGeneratedAt(data.generatedAt as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate feedback.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold uppercase tracking-wide">AI Coach Feedback</h2>
            <p className="text-xs text-muted-foreground">
              Personalized read on your last 28 days of logged sessions
            </p>
          </div>
        </div>
        <Button onClick={generate} disabled={loading} size="sm">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing
            </>
          ) : feedback ? (
            'Regenerate'
          ) : (
            'Generate feedback'
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-start gap-2">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {!feedback && !error && !loading && (
        <p className="text-sm text-muted-foreground">
          Generate a coaching review of your HIIT, TMAR-M, cardio and resistance logs with concrete next steps
          toward the cycle minimums.
        </p>
      )}

      {feedback && (
        <div className="space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg text-primary">{feedback.headline}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{feedback.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {feedback.strengths.length > 0 && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest text-primary mb-2">
                  <TrendingUp className="w-3.5 h-3.5" /> Strengths
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {feedback.gaps.length > 0 && (
              <div className="rounded-xl bg-secondary/40 p-4">
                <p className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest text-primary mb-2">
                  <Target className="w-3.5 h-3.5" /> Gaps
                </p>
                <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-4">
                  {feedback.gaps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {feedback.nextSteps.length > 0 && (
            <div>
              <p className="text-xs font-heading uppercase tracking-widest text-primary mb-3">Next steps</p>
              <div className="space-y-2">
                {feedback.nextSteps.map((step, i) => (
                  <div key={i} className="rounded-xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-wide text-primary font-medium">{step.pillar}</p>
                    <p className="text-sm mt-1">{step.action}</p>
                    {step.target && (
                      <p className="text-xs text-muted-foreground mt-1">Target: {step.target}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {feedback.weekAheadPlan.length > 0 && (
            <div>
              <p className="flex items-center gap-2 text-xs font-heading uppercase tracking-widest text-primary mb-2">
                <CalendarDays className="w-3.5 h-3.5" /> Week ahead
              </p>
              <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal pl-5">
                {feedback.weekAheadPlan.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {generatedAt && (
            <p className="text-xs text-muted-foreground">
              AI-generated {new Date(generatedAt).toLocaleString()} — guidance only, not medical advice.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
