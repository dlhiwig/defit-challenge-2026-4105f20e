import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Loader2, Settings2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SummaryRow {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function WeeklySummaries() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SummaryRow | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, is_read')
        .eq('user_id', user.id)
        .eq('type', 'weekly_summary')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) console.error('Failed to load weekly summaries', error);
      setRows((data as SummaryRow[]) ?? []);
      setLoading(false);
    }
    if (user) load();
  }, [user]);

  async function open(row: SummaryRow) {
    setSelected(row);
    if (!row.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, is_read: true } : r)));
    }
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">AI Weekly Summaries</h2>
            <p className="text-sm text-muted-foreground">
              Generated every Monday from your logged sessions.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/settings/notifications">
            <Settings2 className="w-4 h-4 mr-2" />
            Notification settings
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No summaries yet. Once you log sessions, your first weekly recap arrives Monday at 13:00
          UTC.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => open(row)}
                className="w-full text-left rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{row.message}</p>
                  </div>
                  {!row.is_read && (
                    <span className="shrink-0 mt-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                      New
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatStamp(row.created_at)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!selected} onOpenChange={(next) => !next && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected ? formatStamp(selected.created_at) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm whitespace-pre-line text-muted-foreground">
            {selected?.message}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
