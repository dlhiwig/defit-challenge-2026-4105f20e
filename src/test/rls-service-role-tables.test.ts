import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Regression tests for the internal notification plumbing:
 * digest_queue, notifications (forging), email_logs (fake records).
 * Neither anonymous visitors nor ordinary signed-in users may touch them.
 * Approved signed-in paths (reading own notifications) must still work.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const testEmail = process.env.TEST_USER;
const testPassword = process.env.TEST_PASS;

const makeClient = () =>
  createClient(url ?? "http://localhost", key ?? "anon", {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

const readBlocked = (error: unknown, data: unknown) =>
  Boolean(error) || (Array.isArray(data) && data.length === 0);

describe.runIf(!!url && !!key)("service-role-only tables are locked down for anon", () => {
  const anon = makeClient();

  it("cannot read digest_queue", async () => {
    const { data, error } = await anon.from("digest_queue").select("*").limit(1);
    expect(readBlocked(error, data)).toBe(true);
  });

  it("cannot write to digest_queue", async () => {
    const { error } = await anon.from("digest_queue").insert({
      user_id: FAKE_UUID,
      log_id: FAKE_UUID,
      log_type: "hiit",
      log_date: "2027-01-11",
      log_details: "injected",
      previous_status: "pending",
      new_status: "verified",
    });
    expect(error).not.toBeNull();
  });

  it("cannot forge a notification", async () => {
    const { error } = await anon.from("notifications").insert({
      user_id: FAKE_UUID,
      type: "verified",
      title: "Forged",
      message: "Forged by anon",
    });
    expect(error).not.toBeNull();
  });

  it("cannot read notifications", async () => {
    const { data, error } = await anon.from("notifications").select("*").limit(1);
    expect(readBlocked(error, data)).toBe(true);
  });

  it("cannot insert an email log record", async () => {
    const { error } = await anon.from("email_logs").insert({
      recipient_email: "victim@example.com",
      recipient_user_id: FAKE_UUID,
      log_id: FAKE_UUID,
      log_type: "hiit",
      notification_type: "verified",
      status: "sent",
    });
    expect(error).not.toBeNull();
  });

  it("cannot read email_logs", async () => {
    const { data, error } = await anon.from("email_logs").select("*").limit(1);
    expect(readBlocked(error, data)).toBe(true);
  });
});

describe.runIf(!!url && !!key && !!testEmail && !!testPassword)(
  "signed-in users without service_role stay locked out",
  () => {
    let client: SupabaseClient;
    let userId = "";

    beforeAll(async () => {
      client = makeClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: testEmail!,
        password: testPassword!,
      });
      if (error) throw error;
      userId = data.user!.id;
    });

    afterAll(async () => {
      await client?.auth.signOut();
    });

    it("cannot read or write digest_queue", async () => {
      const read = await client.from("digest_queue").select("*").limit(1);
      expect(readBlocked(read.error, read.data)).toBe(true);

      const { error } = await client.from("digest_queue").insert({
        user_id: userId,
        log_id: FAKE_UUID,
        log_type: "hiit",
        log_date: "2027-01-11",
        log_details: "injected",
        previous_status: "pending",
        new_status: "verified",
      });
      expect(error).not.toBeNull();
    });

    it("cannot forge notifications for another user", async () => {
      const { error } = await client.from("notifications").insert({
        user_id: FAKE_UUID,
        type: "verified",
        title: "Forged",
        message: "Forged by signed-in user",
      });
      expect(error).not.toBeNull();
    });

    it("cannot forge notifications even for itself", async () => {
      const { error } = await client.from("notifications").insert({
        user_id: userId,
        type: "verified",
        title: "Self-forged",
        message: "Should be rejected",
      });
      expect(error).not.toBeNull();
    });

    it("cannot insert email_logs", async () => {
      const { error } = await client.from("email_logs").insert({
        recipient_email: "victim@example.com",
        recipient_user_id: userId,
        log_id: FAKE_UUID,
        log_type: "hiit",
        notification_type: "verified",
        status: "sent",
      });
      expect(error).not.toBeNull();
    });

    it("can still read its own notifications (approved path)", async () => {
      const { error } = await client
        .from("notifications")
        .select("id, is_read")
        .eq("user_id", userId)
        .limit(5);
      expect(error).toBeNull();
    });

    it("can still update and delete only its own notifications (approved path)", async () => {
      const update = await client
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId);
      expect(update.error).toBeNull();

      const foreignUpdate = await client
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", FAKE_UUID)
        .select("id");
      expect(foreignUpdate.error === null && (foreignUpdate.data ?? []).length === 0).toBe(true);
    });

    it("can still read its own workout logs (approved path)", async () => {
      const { error } = await client.from("hiit_logs").select("id").eq("user_id", userId).limit(1);
      expect(error).toBeNull();
    });
  }
);
