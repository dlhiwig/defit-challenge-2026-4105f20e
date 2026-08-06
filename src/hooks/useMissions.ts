import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, isDemoMode } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type MissionFocus = 'strength' | 'cardio' | 'endurance' | 'core' | 'recovery' | 'extreme';
export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Mission {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  focus: MissionFocus;
  difficulty: MissionDifficulty;
  duration_days: number;
  duration_weeks: number | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  participant_count?: number;
  user_enrollment?: {
    id: string;
    status: string;
    current_day_number: number;
    completion_percent: number;
  } | null;
}

export interface MissionPhase {
  id: string;
  mission_id: string;
  phase_number: number;
  title: string;
  start_day: number;
  end_day: number;
  progression_rules: Record<string, any> | null;
}

export interface ScheduleDay {
  id: string;
  day_number: number;
  phase_number: number | null;
  workout_id: string;
  scaling_overrides: Record<string, any> | null;
  workout: {
    id: string;
    title: string;
    description: string | null;
    estimated_minutes: number;
    equipment: string[];
  };
  steps: WorkoutStep[];
  progress_status?: 'not_started' | 'in_progress' | 'completed' | 'skipped';
}

export interface WorkoutStep {
  id: string;
  step_type: 'exercise' | 'interval' | 'rest';
  name: string;
  sets: number | null;
  reps: number | null;
  work_seconds: number | null;
  rest_seconds: number | null;
  distance_meters: number | null;
  load_lbs: number | null;
  notes: string | null;
  order_index: number;
}

export interface MissionsFilter {
  search: string;
  difficulty: MissionDifficulty | '';
  focus: MissionFocus | '';
  duration: string;
  sort: 'popular' | 'newest' | 'shortest' | 'longest';
}

export function useMissions(filters: MissionsFilter) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['missions', filters],
    queryFn: async () => {
      if (isDemoMode) return [];

      let query = supabase
        .from('missions')
        .select('*')
        .eq('is_published', true);

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters.focus) {
        query = query.eq('focus', filters.focus);
      }
      if (filters.duration === '<=21') {
        query = query.lte('duration_days', 21);
      } else if (filters.duration === '30') {
        query = query.eq('duration_days', 30);
      } else if (filters.duration === '8+weeks') {
        query = query.gte('duration_days', 56);
      } else if (filters.duration === '12+weeks') {
        query = query.gte('duration_days', 84);
      }

      if (filters.sort === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sort === 'shortest') {
        query = query.order('duration_days', { ascending: true });
      } else if (filters.sort === 'longest') {
        query = query.order('duration_days', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: missions, error } = await query;
      if (error) throw error;

      // Participant counts come from a secure function so enrollment rows stay private.
      const missionIds = missions.map((m: any) => m.id);
      const countMap: Record<string, number> = {};
      const counts = await Promise.all(
        missionIds.map(async (id: string) => ({
          id,
          count: (await supabase.rpc('get_mission_participant_count', { p_mission_id: id })).data ?? 0,
        }))
      );
      counts.forEach(({ id, count }) => {
        countMap[id] = count as number;
      });

      // Fetch user enrollments if logged in
      let userEnrollments: Record<string, any> = {};
      if (user) {
        const { data: ue } = await supabase
          .from('user_missions')
          .select('*')
          .eq('user_id', user.id)
          .in('mission_id', missionIds);
        (ue || []).forEach((e: any) => {
          userEnrollments[e.mission_id] = e;
        });
      }

      return missions.map((m: any) => ({
        ...m,
        participant_count: countMap[m.id] || 0,
        user_enrollment: userEnrollments[m.id] || null,
      })) as Mission[];
    },
  });
}

export function useMissionDetail(slug: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['mission', slug],
    queryFn: async () => {
      if (isDemoMode) return null;

      const { data: mission, error } = await supabase
        .from('missions')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      if (!mission) return null;

      // Fetch phases, schedule, and participant count in parallel
      const [phasesRes, scheduleRes, countRes, enrollmentRes] = await Promise.all([
        supabase.from('mission_phases').select('*').eq('mission_id', mission.id).order('phase_number'),
        supabase.from('mission_schedule').select('*').eq('mission_id', mission.id).order('day_number'),
        supabase.rpc('get_mission_participant_count', { p_mission_id: mission.id }),
        user
          ? supabase.from('user_missions').select('*').eq('mission_id', mission.id).eq('user_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      // Fetch workouts for schedule
      const workoutIds = [...new Set((scheduleRes.data || []).map((s: any) => s.workout_id))];
      const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .in('id', workoutIds);

      // Fetch workout steps
      const { data: steps } = await supabase
        .from('workout_steps')
        .select('*')
        .in('workout_id', workoutIds)
        .order('order_index');

      // Fetch user day progress
      let dayProgressMap: Record<number, string> = {};
      if (user) {
        const { data: dp } = await supabase
          .from('user_mission_day_progress')
          .select('day_number, status')
          .eq('mission_id', mission.id)
          .eq('user_id', user.id);
        (dp || []).forEach((d: any) => {
          dayProgressMap[d.day_number] = d.status;
        });
      }

      const workoutMap: Record<string, any> = {};
      (workouts || []).forEach((w: any) => { workoutMap[w.id] = w; });

      const stepsMap: Record<string, any[]> = {};
      (steps || []).forEach((s: any) => {
        if (!stepsMap[s.workout_id]) stepsMap[s.workout_id] = [];
        stepsMap[s.workout_id].push(s);
      });

      const schedule: ScheduleDay[] = (scheduleRes.data || []).map((s: any) => ({
        ...s,
        workout: workoutMap[s.workout_id] || { id: s.workout_id, title: 'Unknown', description: null, estimated_minutes: 0, equipment: [] },
        steps: stepsMap[s.workout_id] || [],
        progress_status: dayProgressMap[s.day_number] || 'not_started',
      }));

      return {
        ...mission,
        participant_count: (countRes.data as number | null) ?? 0,
        user_enrollment: enrollmentRes.data,
        phases: phasesRes.data || [],
        schedule,
      } as Mission & { phases: MissionPhase[]; schedule: ScheduleDay[] };
    },
    enabled: !!slug,
  });
}

export function useJoinMission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase.from('user_missions').insert({
        user_id: user.id,
        mission_id: missionId,
        status: 'active',
        current_day_number: 1,
        completion_percent: 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
      toast({ title: 'Mission Joined', description: 'You have been enrolled in this mission.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useLeaveMission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (missionId: string) => {
      if (!user) throw new Error('Must be signed in');
      const { error } = await supabase
        .from('user_missions')
        .delete()
        .eq('user_id', user.id)
        .eq('mission_id', missionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
      toast({ title: 'Mission Left', description: 'You have left this mission.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export function useCompleteMissionDay() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ missionId, dayNumber, workoutId, totalDays }: {
      missionId: string;
      dayNumber: number;
      workoutId: string;
      totalDays: number;
    }) => {
      if (!user) throw new Error('Must be signed in');

      // Upsert day progress
      const { error: dpError } = await supabase
        .from('user_mission_day_progress')
        .upsert({
          user_id: user.id,
          mission_id: missionId,
          day_number: dayNumber,
          workout_id: workoutId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,mission_id,day_number' });
      if (dpError) throw dpError;

      // Count completed days
      const { data: completedDays } = await supabase
        .from('user_mission_day_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('mission_id', missionId)
        .eq('status', 'completed');

      const completedCount = (completedDays || []).length;
      const percent = Math.round((completedCount / totalDays) * 100);
      const nextDay = Math.min(dayNumber + 1, totalDays);

      // Update user_missions
      const updateData: any = {
        current_day_number: nextDay,
        completion_percent: percent,
        last_activity_at: new Date().toISOString(),
      };
      if (percent >= 100) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      const { error: umError } = await supabase
        .from('user_missions')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('mission_id', missionId);
      if (umError) throw umError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      toast({ title: 'Day Complete', description: 'Workout marked as completed.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });
}

export interface EffectiveWorkout {
  mission: {
    title: string;
    slug: string;
    focus: string;
    difficulty: string;
    duration_days: number;
  };
  day_number: number;
  phase: {
    phase_number: number;
    title: string;
    start_day: number;
    end_day: number;
  } | null;
  computed_workout: {
    id: string;
    title: string;
    description: string | null;
    estimated_minutes: number;
    equipment: string[];
  };
  computed_steps: WorkoutStep[];
  applied_modifiers: string[];
  user_day_status: string | null;
}

export function useEffectiveWorkout(slug: string, dayNumber: number) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['effective-workout', slug, dayNumber],
    queryFn: async (): Promise<EffectiveWorkout | null> => {
      if (isDemoMode) return null;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `${supabaseUrl}/functions/v1/compute-effective-workout?slug=${encodeURIComponent(slug)}&day=${dayNumber}`,
        { headers }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 404) return null;
        throw new Error(body.error || 'Failed to load effective workout');
      }

      return res.json();
    },
    enabled: !!slug && dayNumber > 0,
    staleTime: 5 * 60 * 1000,
  });
}
