# DEFIT: from one annual challenge to a year-round platform

## What exists today (audit)

Reusable as-is:
- Auth, profiles, roles (`has_role`), RLS patterns, notifications + email/digest pipeline, AI coach/weekly-summary/recommendation functions.
- Missions engine: `missions`, `mission_phases`, `mission_schedule`, `workouts` (workout templates), `workout_steps`, `user_missions`, day/step progress, progression engine. This is already most of what "training cycles" needs.
- Standings: `get-rankings`, `get-leaderboard`, `ranking_snapshots`, OML scoring engine, official/provisional toggle, teams/commands/units.
- Design system, navbar/footer, marketing pages, legal pages, admin verification panel.

Challenge-specific code that must become seasonal (not global):
- `challenge_config` single-row window + `challenge_window()` — becomes one row per year in `challenge_cycles`.
- `defit_registrations` — becomes `challenge_enrollments` bound to a cycle row.
- Four typed log tables (`cardio_logs`, `strength_logs`, `hiit_logs`, `tmarm_logs`) that each carry competition fields (`verified`, `verified_by`, `admin_comment`) directly on the user's record — competition state must move out.
- `verified boolean` — replaced by an explicit status enum.
- Dashboard/hero/rules copy that frames DEFIT as a 10-week event.

Two naming conflicts to resolve up front:
- The table name `workouts` is already used for **mission workout templates**. The user's persistent history table will be called `activity_logs` (its rows are what the prompt calls "workouts").
- "Missions" currently means multi-week structured programs. Those become **training cycles**; lightweight seasonal missions become a separate, simpler concept.

## Target architecture

Separation principle: users own `activity_logs` forever; a challenge only *credits* slices of it.

```text
activity_logs (permanent, no challenge_id)
      │
      ├─ lifetime / yearly / monthly rollups
      ├─ training cycle progress
      ├─ goals + streaks
      └─ challenge_activity_entries  ← per-cycle adjudication
             raw_value / credited_value / eligibility / verification
```

New tables: `challenge_cycles`, `challenge_enrollments`, `challenge_activity_entries`, `activity_logs`, `training_cycles`, `cycle_enrollments`, `goals`, `achievements`, `user_achievements`, `seasonal_missions`, `seasonal_mission_enrollments`.

Challenge state (`off_season | registration | active | complete`) is derived server-side from the active `challenge_cycles` row — never hardcoded, never client-computed.

## Information architecture

| Route | Purpose |
| --- | --- |
| `/` | Year-round positioning: TRAIN · TRACK · IMPROVE · COMPETE |
| `/dashboard` | Year-round home (today's activity, streak, weekly, cycles, challenge card) |
| `/train` | Log activity + today's recommendation |
| `/progress` | Lifetime / year / month / cycle / challenge scopes |
| `/cycles`, `/cycles/:slug` | Recurring training cycles |
| `/missions`, `/missions/:slug` | Seasonal missions and badges |
| `/challenge` | Redirects to the active/most recent year |
| `/challenge/:year` | Season hub, state-aware |
| `/challenge/:year/rankings`, `/rules`, `/progress` | Season sub-pages |
| `/resources`, `/profile` | Unchanged content, renamed nav |

Nav: Dashboard · Train · Progress · Cycles · Missions · Challenge · Resources · Profile. Old routes (`/dashboard/progress`, `/rankings`, `/leaderboard`, `/rules`, `/register`) keep working via redirects so nothing in the wild breaks.

## Phases

**Phase 1 — Challenge becomes data (no UI loss)**
- `challenge_cycles` table + `active_challenge_cycle()` and `challenge_state()` functions; seed DEFIT 2027 from current config; keep `challenge_window()` as a thin wrapper so existing functions keep working.
- `challenge_enrollments` table; migrate `defit_registrations` rows; `/register` writes to both during cutover.
- `/challenge/:year` shell with the four states, plus redirects. `challenge_config` retired.

**Phase 2 — Fitness history vs competition scoring**
- `activity_logs` (unified, typed detail columns, `source`, no challenge fields) + backfill from the four log tables; the four tables stay readable until cutover, then become views.
- `verification_status` enum (`pending|verified|flagged|rejected|correction_requested|superseded`) and `challenge_activity_entries` with `raw_value`/`credited_value`, weekly-cap crediting computed server-side.
- Admin panel + `admin-verify-logs` move to entries; participants can never write verification columns (trigger-enforced, as today).
- Ranking functions read credited values instead of re-deriving caps.

**Phase 3 — Year-round dashboard**
- New dashboard: today's recommended activity, readiness summary, this week's workouts, streak, four-pillar progress, goals, active training cycle, active missions, and a challenge card that changes with state.
- `/progress` scope switcher (lifetime / year / month / cycle / challenge credited).

**Phase 4 — Recurring training cycles**
- `training_cycles` + `cycle_enrollments` with weekly targets and completion status; reuse the missions engine for scheduling. Seed the six cycle types (4-week conditioning, 6-week strength, 30-day mobility, ACFT prep, running, weight management).
- Enrollment never alters lifetime history.

**Phase 5 — Seasonal missions, badges, positioning**
- Lightweight missions (January Baseline, Reserve Birthday, Independence Mileage, Mobility Month, Veterans Fitness, Year-End Readiness) awarding badges/streak credit only — no effect on challenge ranking.
- Rewrite public messaging to "READY EVERY DAY. STRONGER EVERY YEAR." and the four pillars; update rules to describe the platform plus the annual season.

## Guardrails

- Every phase ships working; no phase deletes a table that current code still reads. Old tables become views or stay dual-written until their readers are migrated.
- All new public tables get GRANTs + RLS scoped to `auth.uid()`, with admin access via `has_role`.
- Competition math stays server-side; regression tests extend the existing 56-test suite before each cutover.
- Existing styling, components, and the verification workflow are preserved.

## Technical notes

- `challenge_state()` is a stable SQL function reading the active cycle row; the frontend consumes it through a single hook so no component computes dates.
- `src/lib/challenge.ts` keeps its auto-roll math as the offline/default fallback only; the database row wins when present.
- Credited values are recomputed by trigger on entry write and on verification change, so caps can be tuned per cycle via `challenge_cycles.rules_version`.

## Suggested start

Phase 1 only in the next pass: the `challenge_cycles`/`challenge_enrollments` migration plus the `/challenge/:year` state-aware area and redirects. That removes every hardcoded year from the challenge path without touching logging or scoring.
