import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// PROGRESSION COMPUTATION MODULE
// ============================================================
//
// Supported progression_rules JSON schemas:
//
// 1) HIIT
//    { "type": "hiit", "rounds": N, "work_seconds": N, "rest_seconds": N }
//    or with by_week: { "type": "hiit", "by_week": { "1": { rounds, work_seconds, rest_seconds }, ... } }
//    Computes week from dayNumber: ceil(dayNumber / 7).
//
// 2) Strength
//    { "type": "strength", "weekly_load_increase_pct": N, "deload_week": N, "deload_multiplier": N }
//    Increases load_lbs by pct each week; on deload_week applies multiplier instead.
//
// 3) Ruck
//    { "type": "ruck", "weekly_distance_increase_pct": N, "weekly_load_increase_lbs": N,
//      "recovery_every_n_weeks": N, "recovery_multiplier": N }
//    Scales distance/load; applies recovery multiplier on recovery weeks.
//
// 4) Core / Mobility / Multiplier (generic)
//    { "type": "core"|"mobility"|"multiplier", "time_increase_pct": N, "sets_increase": N }
//    or { "type": "multiplier", "targets": { "sets": 1.1, "reps": 1.1 } }
//
// ============================================================

interface WorkoutStep {
  id: string;
  step_type: string;
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

interface ComputedStep extends WorkoutStep {
  original_sets?: number | null;
  original_reps?: number | null;
  original_work_seconds?: number | null;
  original_rest_seconds?: number | null;
  original_distance_meters?: number | null;
  original_load_lbs?: number | null;
}

export function computeWeekNumber(dayNumber: number): number {
  return Math.ceil(dayNumber / 7);
}

function roundTo5(val: number): number {
  return Math.round(val / 5) * 5;
}

function clampMin(val: number, min: number): number {
  return Math.max(val, min);
}

function roundInt(val: number): number {
  return Math.round(val);
}

export function applyProgressionRules(
  steps: WorkoutStep[],
  rules: Record<string, any> | null,
  dayNumber: number,
  phaseStartDay: number
): { computed: ComputedStep[]; modifiers: string[] } {
  if (!rules || !rules.type) {
    return { computed: steps.map((s) => ({ ...s })), modifiers: [] };
  }

  const week = computeWeekNumber(dayNumber);
  const weekInPhase = computeWeekNumber(dayNumber - phaseStartDay + 1);
  const modifiers: string[] = [];
  const type = rules.type as string;

  const computed: ComputedStep[] = steps.map((step) => {
    const s: ComputedStep = {
      ...step,
      original_sets: step.sets,
      original_reps: step.reps,
      original_work_seconds: step.work_seconds,
      original_rest_seconds: step.rest_seconds,
      original_distance_meters: step.distance_meters,
      original_load_lbs: step.load_lbs,
    };

    if (type === "hiit") {
      // by_week format
      if (rules.by_week) {
        const weekKey = String(week);
        const weekRules = rules.by_week[weekKey];
        if (weekRules) {
          if (weekRules.work_seconds != null && s.work_seconds != null) {
            s.work_seconds = roundTo5(weekRules.work_seconds);
          }
          if (weekRules.rest_seconds != null && s.rest_seconds != null) {
            s.rest_seconds = roundTo5(clampMin(weekRules.rest_seconds, 5));
          }
        }
      } else {
        // Flat HIIT rules from phase
        if (rules.work_seconds != null && s.work_seconds != null) {
          s.work_seconds = roundTo5(rules.work_seconds);
        }
        if (rules.rest_seconds != null && s.rest_seconds != null) {
          s.rest_seconds = roundTo5(clampMin(rules.rest_seconds, 5));
        }
      }
    } else if (type === "strength") {
      const increase = rules.weekly_load_increase_pct || 0;
      const deloadWeek = rules.deload_week;
      const deloadMult = rules.deload_multiplier || 0.7;
      const isDeload = deloadWeek && (weekInPhase % deloadWeek === 0);

      if (s.load_lbs != null && s.load_lbs > 0) {
        if (isDeload) {
          s.load_lbs = roundInt(clampMin(s.load_lbs * deloadMult, 1));
        } else if (increase > 0 && weekInPhase > 1) {
          const factor = 1 + (increase / 100) * (weekInPhase - 1);
          s.load_lbs = roundInt(clampMin(s.load_lbs * factor, 1));
        }
      }
    } else if (type === "ruck") {
      const distIncrease = rules.weekly_distance_increase_pct || 0;
      const loadIncrease = rules.weekly_load_increase_lbs || 0;
      const recoveryEvery = rules.recovery_every_n_weeks;
      const recoveryMult = rules.recovery_multiplier || 0.8;
      const isRecovery = recoveryEvery && (weekInPhase % recoveryEvery === 0);

      if (s.distance_meters != null && s.distance_meters > 0) {
        if (isRecovery) {
          s.distance_meters = roundInt(s.distance_meters * recoveryMult);
        } else if (distIncrease && weekInPhase > 1) {
          const factor = 1 + (distIncrease / 100) * (weekInPhase - 1);
          s.distance_meters = roundInt(clampMin(s.distance_meters * factor, 1));
        }
      }
      if (s.load_lbs != null && s.load_lbs > 0) {
        if (isRecovery) {
          s.load_lbs = roundInt(s.load_lbs * recoveryMult);
        } else if (loadIncrease && weekInPhase > 1) {
          s.load_lbs = roundInt(clampMin(s.load_lbs + loadIncrease * (weekInPhase - 1), 1));
        }
      }
    } else if (type === "core" || type === "mobility") {
      const timeIncrease = rules.time_increase_pct || 0;
      const setsIncrease = rules.sets_increase || 0;

      if (timeIncrease && s.work_seconds != null && s.work_seconds > 0) {
        const factor = 1 + timeIncrease / 100;
        s.work_seconds = roundTo5(clampMin(s.work_seconds * factor, 5));
      }
      if (setsIncrease && s.sets != null && s.sets > 0) {
        s.sets = clampMin(s.sets + setsIncrease, 1);
      }
    } else if (type === "multiplier") {
      const targets = rules.targets || {};
      for (const [field, mult] of Object.entries(targets)) {
        const key = field as keyof ComputedStep;
        const val = s[key];
        if (typeof val === "number" && val > 0 && typeof mult === "number") {
          if (field === "work_seconds" || field === "rest_seconds") {
            (s as any)[key] = roundTo5(clampMin(val * mult, 5));
          } else {
            (s as any)[key] = roundInt(clampMin(val * mult, 1));
          }
        }
      }
    }

    return s;
  });

  // Build modifier messages
  if (type === "hiit") {
    const weekRules = rules.by_week?.[String(week)];
    if (weekRules) {
      modifiers.push(
        `Phase rule applied: Week ${week} HIIT progression (rounds ${weekRules.rounds ?? "N/A"}, work ${weekRules.work_seconds ?? "N/A"}s, rest ${weekRules.rest_seconds ?? "N/A"}s)`
      );
    } else if (rules.work_seconds || rules.rest_seconds) {
      modifiers.push(
        `Phase rule applied: HIIT phase values (work ${rules.work_seconds ?? "base"}s, rest ${rules.rest_seconds ?? "base"}s)`
      );
    }
  } else if (type === "strength") {
    const isDeload = rules.deload_week && (weekInPhase % rules.deload_week === 0);
    if (isDeload) {
      modifiers.push(`Phase rule applied: Deload week ${weekInPhase} (${Math.round(rules.deload_multiplier * 100)}% load)`);
    } else if (rules.weekly_load_increase_pct && weekInPhase > 1) {
      modifiers.push(`Phase rule applied: Strength progression week ${weekInPhase} (+${rules.weekly_load_increase_pct}%/week)`);
    }
  } else if (type === "ruck") {
    const isRecovery = rules.recovery_every_n_weeks && (weekInPhase % rules.recovery_every_n_weeks === 0);
    if (isRecovery) {
      modifiers.push(`Phase rule applied: Ruck recovery week ${weekInPhase} (${Math.round((rules.recovery_multiplier || 0.8) * 100)}% volume)`);
    } else if (weekInPhase > 1) {
      modifiers.push(`Phase rule applied: Ruck progression week ${weekInPhase} (+${rules.weekly_distance_increase_pct || 0}% distance, +${rules.weekly_load_increase_lbs || 0} lbs/week)`);
    }
  } else if (type === "core" || type === "mobility") {
    if (rules.time_increase_pct || rules.sets_increase) {
      modifiers.push(`Phase rule applied: ${type} progression (+${rules.time_increase_pct || 0}% time, +${rules.sets_increase || 0} sets)`);
    }
  } else if (type === "multiplier") {
    modifiers.push(`Phase rule applied: Volume multiplier (${JSON.stringify(rules.targets)})`);
  }

  return { computed, modifiers };
}

export function applyScalingOverrides(
  steps: ComputedStep[],
  overrides: Record<string, any> | null
): { scaled: ComputedStep[]; modifiers: string[] } {
  if (!overrides || Object.keys(overrides).length === 0) {
    return { scaled: steps, modifiers: [] };
  }

  const modifiers: string[] = [];
  const overrideMessages: string[] = [];

  const scaled = steps.map((step) => {
    const s = { ...step };

    if (overrides.sets_multiplier != null && s.sets != null && s.sets > 0) {
      s.sets = roundInt(clampMin(s.sets * overrides.sets_multiplier, 1));
    }
    if (overrides.reps_multiplier != null && s.reps != null && s.reps > 0) {
      s.reps = roundInt(clampMin(s.reps * overrides.reps_multiplier, 1));
    }
    if (overrides.rest_seconds_delta != null && s.rest_seconds != null) {
      s.rest_seconds = roundTo5(clampMin(s.rest_seconds + overrides.rest_seconds_delta, 5));
    }
    if (overrides.work_seconds_delta != null && s.work_seconds != null) {
      s.work_seconds = roundTo5(clampMin(s.work_seconds + overrides.work_seconds_delta, 5));
    }
    if (overrides.load_pct_increase != null && s.load_lbs != null && s.load_lbs > 0) {
      s.load_lbs = roundInt(clampMin(s.load_lbs * (1 + overrides.load_pct_increase / 100), 1));
    }
    if (overrides.load_increase_lbs != null && s.load_lbs != null && s.load_lbs > 0) {
      s.load_lbs = roundInt(clampMin(s.load_lbs + overrides.load_increase_lbs, 1));
    }
    if (overrides.rounds != null) {
      // "rounds" is informational for HIIT context; doesn't directly map to a step field
    }

    return s;
  });

  // Build override messages
  const parts: string[] = [];
  if (overrides.sets_multiplier != null) parts.push(`sets_multiplier=${overrides.sets_multiplier}`);
  if (overrides.reps_multiplier != null) parts.push(`reps_multiplier=${overrides.reps_multiplier}`);
  if (overrides.rest_seconds_delta != null) parts.push(`rest_seconds_delta=${overrides.rest_seconds_delta}`);
  if (overrides.work_seconds_delta != null) parts.push(`work_seconds_delta=${overrides.work_seconds_delta}`);
  if (overrides.load_pct_increase != null) parts.push(`load_pct_increase=${overrides.load_pct_increase}%`);
  if (overrides.load_increase_lbs != null) parts.push(`load_increase_lbs=${overrides.load_increase_lbs}`);
  if (overrides.rounds != null) parts.push(`rounds=${overrides.rounds}`);
  if (parts.length > 0) {
    modifiers.push(`Day override applied: ${parts.join(", ")}`);
  }

  return { scaled, modifiers };
}

// ============================================================
// EDGE FUNCTION HANDLER
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const dayNumberStr = url.searchParams.get("day");

    if (!slug || !dayNumberStr) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: slug, day" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const dayNumber = parseInt(dayNumberStr, 10);
    if (isNaN(dayNumber) || dayNumber < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid day number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1) Load mission
    const { data: mission, error: missionErr } = await supabase
      .from("missions")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (missionErr) throw missionErr;
    if (!mission) {
      return new Response(
        JSON.stringify({ error: "Mission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (dayNumber > mission.duration_days) {
      return new Response(
        JSON.stringify({ error: `Day ${dayNumber} exceeds mission duration of ${mission.duration_days} days` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Load schedule entry for this day
    const { data: scheduleEntry, error: schedErr } = await supabase
      .from("mission_schedule")
      .select("*")
      .eq("mission_id", mission.id)
      .eq("day_number", dayNumber)
      .maybeSingle();

    if (schedErr) throw schedErr;
    if (!scheduleEntry) {
      return new Response(
        JSON.stringify({
          error: `No schedule entry for day ${dayNumber}. This day may be unscheduled.`,
          mission: { title: mission.title, slug: mission.slug, focus: mission.focus, difficulty: mission.difficulty },
          day_number: dayNumber,
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Load workout + steps + phase in parallel
    const [workoutRes, stepsRes, phaseRes] = await Promise.all([
      supabase.from("workouts").select("*").eq("id", scheduleEntry.workout_id).maybeSingle(),
      supabase.from("workout_steps").select("*").eq("workout_id", scheduleEntry.workout_id).order("order_index"),
      supabase.from("mission_phases").select("*").eq("mission_id", mission.id)
        .lte("start_day", dayNumber).gte("end_day", dayNumber).maybeSingle(),
    ]);

    if (workoutRes.error) throw workoutRes.error;
    if (stepsRes.error) throw stepsRes.error;

    const workout = workoutRes.data;
    const baseSteps: WorkoutStep[] = stepsRes.data || [];
    const phase = phaseRes.data;

    if (!workout) {
      return new Response(
        JSON.stringify({ error: "Workout template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4) Apply progression rules from phase
    const phaseStartDay = phase?.start_day || 1;
    const progressionRules = phase?.progression_rules || null;
    const { computed: afterPhase, modifiers: phaseModifiers } = applyProgressionRules(
      baseSteps, progressionRules, dayNumber, phaseStartDay
    );

    // 5) Apply per-day scaling overrides
    const { scaled: finalSteps, modifiers: overrideModifiers } = applyScalingOverrides(
      afterPhase, scheduleEntry.scaling_overrides
    );

    const allModifiers = [...phaseModifiers, ...overrideModifiers];

    // 6) Check user auth for progress status
    let userDayStatus: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: dayProgress } = await supabase
          .from("user_mission_day_progress")
          .select("status")
          .eq("user_id", user.id)
          .eq("mission_id", mission.id)
          .eq("day_number", dayNumber)
          .maybeSingle();
        userDayStatus = dayProgress?.status || "not_started";
      }
    }

    // 7) Build response
    const response = {
      mission: {
        title: mission.title,
        slug: mission.slug,
        focus: mission.focus,
        difficulty: mission.difficulty,
        duration_days: mission.duration_days,
      },
      day_number: dayNumber,
      phase: phase
        ? { phase_number: phase.phase_number, title: phase.title, start_day: phase.start_day, end_day: phase.end_day }
        : null,
      computed_workout: {
        id: workout.id,
        title: workout.title,
        description: workout.description,
        estimated_minutes: workout.estimated_minutes,
        equipment: workout.equipment,
      },
      computed_steps: finalSteps.map((s) => ({
        id: s.id,
        step_type: s.step_type,
        name: s.name,
        sets: s.sets,
        reps: s.reps,
        work_seconds: s.work_seconds,
        rest_seconds: s.rest_seconds,
        distance_meters: s.distance_meters,
        load_lbs: s.load_lbs,
        notes: s.notes,
        order_index: s.order_index,
      })),
      applied_modifiers: allModifiers,
      user_day_status: userDayStatus,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": userDayStatus ? "private, no-cache" : "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("compute-effective-workout error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
