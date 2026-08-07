import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FunctionsHttpError } from '@supabase/supabase-js';

interface Recommendation {
  slug: string;
  title: string;
  focus: string;
  difficulty: string;
  durationLabel: string;
  fitScore: number;
  reason: string;
  startTip: string;
}

export function AIMissionRecommendations() {
  const { user } = useAuth();
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-mission-recommendations', {
        body: { goals },
      });
      if (fnError) {
        let message = fnError.message;
        if (fnError instanceof FunctionsHttpError) {
          const body = await fnError.context.json().catch(() => null);
          message = body?.error ?? message;
        }
        throw new Error(message);
      }
      setRecommendations((data.recommendations ?? []) as Recommendation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold uppercase tracking-wide">Find my next challenge</h2>
          <p className="text-xs text-muted-foreground">
            AI matches missions to your goals and your last 60 days of activity
          </p>
        </div>
      </div>

      <Textarea
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        placeholder="What are you training for? e.g. improve my 2-mile run time and build core strength without aggravating my knee."
        rows={3}
        maxLength={600}
        className="mb-3"
      />
      <Button onClick={generate} disabled={loading} size="sm">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Matching missions
          </>
        ) : (
          'Recommend missions'
        )}
      </Button>

      {error && (
        <p className="mt-4 text-sm text-destructive flex items-start gap-2">
          <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="mt-6 space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.slug} className="rounded-xl border border-border/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-heading font-bold">{rec.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.focus} · {rec.difficulty} · {rec.durationLabel}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {rec.fitScore}% fit
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{rec.reason}</p>
              {rec.startTip && <p className="text-xs text-primary mt-2">Start tip: {rec.startTip}</p>}
              <Button asChild size="sm" variant="ghost" className="mt-2 px-0 hover:bg-transparent">
                <Link to={`/missions/${rec.slug}`}>
                  View mission <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
