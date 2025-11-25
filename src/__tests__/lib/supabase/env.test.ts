import { describe, expect, it, afterEach } from "vitest";
import { getSupabaseEnv } from "@/lib/supabase/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("getSupabaseEnv", () => {
  it("throws when URL is missing", () => {
    delete process.env["NEXT_PUBLIC_SUPABASE_URL"];
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon";

    expect(() => getSupabaseEnv()).toThrow(
      "Missing env NEXT_PUBLIC_SUPABASE_URL"
    );
  });

  it("throws when anon key is missing", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://supabase.test";
    delete process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

    expect(() => getSupabaseEnv()).toThrow(
      "Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  });

  it("returns values when both are set", () => {
    process.env["NEXT_PUBLIC_SUPABASE_URL"] = "https://supabase.test";
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] = "anon";

    const env = getSupabaseEnv();

    expect(env).toEqual({
      url: "https://supabase.test",
      anonKey: "anon",
    });
  });
});
