import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const missionRow = {
  id: "m1",
  slug: "test",
  title: "Test Mission",
  short_description: "d",
  focus: "strength",
  difficulty: "beginner",
  duration_days: 30,
  duration_weeks: 4,
  cover_image_url: null,
  is_published: true,
  created_at: new Date().toISOString(),
};

const rpc = vi.fn();
const authUser = { current: null as { id: string } | null };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authUser.current, session: null, loading: false }),
}));

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock("@/integrations/supabase/client", () => {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    or: () => chain,
    lte: () => chain,
    gte: () => chain,
    in: () => Promise.resolve({ data: [], error: null }),
    order: () => Promise.resolve({ data: [missionRow], error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  };
  return {
    isDemoMode: false,
    supabase: { from: () => chain, rpc: (...a: unknown[]) => rpc(...a) },
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return React.createElement(QueryClientProvider, { client }, children);
};

const filters = {
  search: "",
  difficulty: "" as const,
  focus: "" as const,
  duration: "",
  sort: "popular" as const,
};

describe("useMissions participant counts degrade gracefully", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("skips the restricted RPC entirely for anonymous visitors", async () => {
    authUser.current = null;
    const { useMissions } = await import("@/hooks/useMissions");
    const { result } = renderHook(() => useMissions(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rpc).not.toHaveBeenCalled();
    expect(result.current.data?.[0].participant_count).toBe(0);
    expect(result.current.data?.[0].user_enrollment).toBeNull();
  });

  it("falls back to 0 when the count RPC is denied for a signed-in user", async () => {
    authUser.current = { id: "u1" };
    rpc.mockResolvedValue({ data: null, error: { message: "permission denied" } });
    const { useMissions } = await import("@/hooks/useMissions");
    const { result } = renderHook(() => useMissions(filters), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(rpc).toHaveBeenCalled();
    expect(result.current.data?.[0].participant_count).toBe(0);
  });
});
