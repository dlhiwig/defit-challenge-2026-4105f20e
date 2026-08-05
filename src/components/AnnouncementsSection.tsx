import { useEffect, useState } from 'react';
import { CalendarDays, Megaphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CHALLENGE_CYCLE, CHALLENGE_LABEL } from '@/lib/challenge';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  milestone_date: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  milestone: 'Milestone',
  update: 'Update',
  deadline: 'Deadline',
  kickoff: 'Kickoff',
};

function formatMilestone(date: string | null) {
  if (!date) return null;
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface AnnouncementsSectionProps {
  limit?: number;
  compact?: boolean;
}

export function AnnouncementsSection({ limit = 4, compact = false }: AnnouncementsSectionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, body, category, milestone_date')
        .eq('is_published', true)
        .eq('cycle', CHALLENGE_CYCLE)
        .order('milestone_date', { ascending: true, nullsFirst: false })
        .limit(limit);

      if (error) console.error('Failed to load announcements:', error);
      if (!cancelled) {
        setAnnouncements(data ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading || announcements.length === 0) return null;

  return (
    <section className={compact ? '' : 'py-16'} aria-labelledby="announcements-heading">
      <div className={compact ? '' : 'container px-4'}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2
              id="announcements-heading"
              className="text-2xl font-heading font-bold uppercase tracking-wide"
            >
              {CHALLENGE_LABEL} Announcements
            </h2>
            <p className="text-sm text-muted-foreground">Upcoming milestones and cycle updates</p>
          </div>
        </div>

        <ul className="grid gap-4 md:grid-cols-2">
          {announcements.map((item) => {
            const milestone = formatMilestone(item.milestone_date);
            return (
              <li key={item.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs uppercase tracking-widest text-primary font-heading">
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  {milestone && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {milestone}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default AnnouncementsSection;
