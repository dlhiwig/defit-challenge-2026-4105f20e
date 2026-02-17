import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

const BASE = `${SUPABASE_URL}/functions/v1/compute-effective-workout`;

async function fetchEffective(slug: string, day: number) {
  const res = await fetch(`${BASE}?slug=${slug}&day=${day}`, {
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
  });
  const body = await res.json();
  return { status: res.status, body };
}

// ============================================================
// Integration Tests
// ============================================================

Deno.test("Returns 400 for missing params", async () => {
  const res = await fetch(BASE, {
    headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
  });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
});

Deno.test("Returns 404 for unknown mission", async () => {
  const { status, body } = await fetchEffective("nonexistent-mission-xyz", 1);
  assertEquals(status, 404);
  assertExists(body.error);
});

Deno.test("Returns 400 for day exceeding duration", async () => {
  const { status, body } = await fetchEffective("30-day-tactical-hiit", 999);
  assertEquals(status, 400);
  assertExists(body.error);
});

Deno.test("HIIT day 1 returns computed workout with correct shape", async () => {
  const { status, body } = await fetchEffective("30-day-tactical-hiit", 1);
  assertEquals(status, 200);
  assertExists(body.mission);
  assertEquals(body.mission.slug, "30-day-tactical-hiit");
  assertEquals(body.day_number, 1);
  assertExists(body.computed_workout);
  assertExists(body.computed_steps);
  assertEquals(Array.isArray(body.computed_steps), true);
  assertEquals(Array.isArray(body.applied_modifiers), true);
});

Deno.test("HIIT day 1 phase info is Foundation", async () => {
  const { body } = await fetchEffective("30-day-tactical-hiit", 1);
  assertExists(body.phase);
  assertEquals(body.phase.title, "Foundation");
  assertEquals(body.phase.phase_number, 1);
});

Deno.test("Strength Foundation day 1 returns steps with load values", async () => {
  const { status, body } = await fetchEffective("strength-foundation", 1);
  assertEquals(status, 200);
  assertEquals(body.mission.slug, "strength-foundation");
  const stepsWithLoad = body.computed_steps.filter((s: any) => s.load_lbs != null);
  assertEquals(stepsWithLoad.length > 0, true);
});

Deno.test("Ruck March Elite day 1 returns ruck workout", async () => {
  const { status, body } = await fetchEffective("ruck-march-elite", 1);
  assertEquals(status, 200);
  assertEquals(body.mission.slug, "ruck-march-elite");
  assertExists(body.computed_workout);
});

Deno.test("Core Conditioning day 1 returns core steps", async () => {
  const { status, body } = await fetchEffective("core-conditioning", 1);
  assertEquals(status, 200);
  assertEquals(body.computed_steps.length > 0, true);
});

Deno.test("Mobility Protocol day 1 returns mobility flow", async () => {
  const { status, body } = await fetchEffective("mobility-protocol", 1);
  assertEquals(status, 200);
  assertExists(body.computed_workout);
});

Deno.test("Beast Mode day 1 returns beast total body workout", async () => {
  const { status, body } = await fetchEffective("beast-mode", 1);
  assertEquals(status, 200);
  assertEquals(body.mission.slug, "beast-mode");
  assertEquals(body.computed_steps.length > 0, true);
});

Deno.test("Response has stable JSON shape across missions", async () => {
  const missions = ["30-day-tactical-hiit", "strength-foundation", "core-conditioning"];
  for (const slug of missions) {
    const { status, body } = await fetchEffective(slug, 1);
    assertEquals(status, 200);
    // Verify common shape
    assertExists(body.mission);
    assertExists(body.mission.title);
    assertExists(body.mission.slug);
    assertExists(body.computed_workout);
    assertExists(body.computed_workout.title);
    assertEquals(typeof body.day_number, "number");
    assertEquals(Array.isArray(body.computed_steps), true);
    assertEquals(Array.isArray(body.applied_modifiers), true);
  }
});
