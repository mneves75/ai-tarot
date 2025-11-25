import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const nextResponseInstance = {
    cookies: { set: vi.fn() },
  };

  return {
    nextResponseInstance,
    nextResponse: { next: vi.fn(() => nextResponseInstance) },
    supabase: {
      auth: { getSession: vi.fn() },
    },
  };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mocks.supabase),
}));

vi.mock("next/server", () => ({
  NextResponse: mocks.nextResponse,
}));

vi.mock("@/lib/supabase/env", () => ({
  getSupabaseEnv: () => ({ url: "https://supabase.test", anonKey: "anon" }),
}));

import { proxy } from "@/proxy";

describe("proxy", () => {
  it("refreshes session and returns response with cookies set", async () => {
    const request = {
      cookies: {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      },
    } as unknown as Request;

    const response = await proxy(request as unknown as Parameters<typeof proxy>[0]);

    expect(mocks.supabase.auth.getSession).toHaveBeenCalledTimes(1);
    expect(mocks.nextResponse.next).toHaveBeenCalledTimes(1);
    expect(response).toBe(mocks.nextResponseInstance);
  });
});
