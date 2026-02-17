import { useQuery } from '@tanstack/react-query';
import { supabase, isDemoMode } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MyMissionEnrollment {
  mission: {
    slug: string;
    title: string;
    focus: string;
    difficulty: string;
    duration_days: number;
  };
  status: string;
  completion_percent: number;
  current_day_number: number;
  next_day_number: number;
  last_activity_at: string | null;
}

export function useMyMissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-missions', user?.id],
    queryFn: async (): Promise<MyMissionEnrollment[]> => {
      if (isDemoMode || !user) return [];

      // Fetch active enrollments
      const { data: enrollments, error: eErr } = await supabase
        .from('user_missions')
        .select('mission_id, status, current_day_number, completion_percent, last_activity_at')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (eErr) throw eErr;
      if (!enrollments || enrollments.length === 0) return [];

      const missionIds = enrollments.map(e => e.mission_id);

      // Fetch mission metadata and day progress in parallel
      const [missionsRes, progressRes] = await Promise.all([
        supabase
          .from('missions')
          .select('id, slug, title, focus, difficulty, duration_days')
          .in('id', missionIds),
        supabase
          .from('user_mission_day_progress')
          .select('mission_id, day_number, status')
          .eq('user_id', user.id)
          .in('mission_id', missionIds),
      ]);

      if (missionsRes.error) throw missionsRes.error;

      const missionMap: Record<string, typeof missionsRes.data[0]> = {};
      (missionsRes.data || []).forEach(m => { missionMap[m.id] = m; });

      // Build completed days set per mission
      const completedDays: Record<string, Set<number>> = {};
      (progressRes.data || []).forEach(p => {
        if (p.status === 'completed') {
          if (!completedDays[p.mission_id]) completedDays[p.mission_id] = new Set();
          completedDays[p.mission_id].add(p.day_number);
        }
      });

      return enrollments
        .map(e => {
          const mission = missionMap[e.mission_id];
          if (!mission) return null;

          // Compute next incomplete day
          const completed = completedDays[e.mission_id] || new Set<number>();
          let nextDay = 1;
          for (let d = 1; d <= mission.duration_days; d++) {
            if (!completed.has(d)) {
              nextDay = d;
              break;
            }
            if (d === mission.duration_days) {
              nextDay = mission.duration_days;
            }
          }

          return {
            mission: {
              slug: mission.slug,
              title: mission.title,
              focus: mission.focus,
              difficulty: mission.difficulty,
              duration_days: mission.duration_days,
            },
            status: e.status,
            completion_percent: e.completion_percent,
            current_day_number: e.current_day_number,
            next_day_number: nextDay,
            last_activity_at: e.last_activity_at,
          } as MyMissionEnrollment;
        })
        .filter(Boolean) as MyMissionEnrollment[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
