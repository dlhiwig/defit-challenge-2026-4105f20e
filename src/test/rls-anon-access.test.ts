import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Regression tests for the security hardening migration.
 * Anonymous (unauthenticated) visitors must NOT be able to read
 * ranking snapshots or team rosters, and must NOT be able to call
 * the participant-count function.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const anon = createClient(url ?? "http://localhost", key ?? "anon", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const isBlocked = (error: unknown, data: unknown) => {
  // Either an explicit permission/RLS error, or an empty result set (RLS filtered).
  if (error) return true;
  return Array.isArray(data) && data.length === 0;
};

describe.runIf(!!url && !!key)("anonymous access is locked down", () => {
  it("cannot read ranking_snapshots", async () => {
    const { data, error } = await anon.from("ranking_snapshots").select("*").limit(1);
    expect(isBlocked(error, data)).toBe(true);
  });

  it("cannot read team_members rosters", async () => {
    const { data, error } = await anon.from("team_members").select("*").limit(1);
    expect(isBlocked(error, data)).toBe(true);
  });

  it("cannot read teams", async () => {
    const { data, error } = await anon.from("teams").select("*").limit(1);
    expect(isBlocked(error, data)).toBe(true);
  });

  it("cannot read commands or challenge_config", async () => {
    const [cmds, cfg] = await Promise.all([
      anon.from("commands").select("*").limit(1),
      anon.from("challenge_config").select("*").limit(1),
    ]);
    expect(isBlocked(cmds.error, cmds.data)).toBe(true);
    expect(isBlocked(cfg.error, cfg.data)).toBe(true);
  });

  it("cannot read participant enrollments (user_missions)", async () => {
    const { data, error } = await anon.from("user_missions").select("*").limit(1);
    expect(isBlocked(error, data)).toBe(true);
  });

  it("cannot execute get_mission_participant_count", async () => {
    const { error } = await anon.rpc("get_mission_participant_count", {
      p_mission_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(error).not.toBeNull();
  });

  it("can still read the published missions catalog", async () => {
    const { error } = await anon.from("missions").select("id").eq("is_published", true).limit(1);
    expect(error).toBeNull();
  });
});
