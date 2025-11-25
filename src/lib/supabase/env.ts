/**
 * Supabase environment variable helper.
 *
 * Centralizes validation for public Supabase credentials to avoid
 * non-null assertions and provide clearer runtime errors.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || url.trim() === "") {
    throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey || anonKey.trim() === "") {
    throw new Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}
