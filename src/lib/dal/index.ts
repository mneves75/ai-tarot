import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer (DAL) for authentication.
 *
 * SECURITY: This is the ONLY way to get authenticated user context.
 * NEVER use middleware for authentication (CVE-2025-29927 vulnerability).
 *
 * Per WEB-NEXTJS-GUIDELINES: All auth checks must happen in the DAL,
 * not in middleware or layout components.
 *
 * @module lib/dal
 */

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  locale: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

/**
 * Get the current authenticated user with their profile.
 *
 * Uses React cache to prevent duplicate database calls per request.
 * Returns null if user is not authenticated or profile is soft-deleted.
 *
 * @example
 * ```ts
 * const user = await getUser();
 * if (user) {
 *   console.log(`Welcome, ${user.profile?.name ?? user.email}`);
 * }
 * ```
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  // Get extended profile from Drizzle
  // CRITICAL: Filter by deleted_at IS NULL for soft-delete support
  const [profile] = await db
    .select()
    .from(profiles)
    .where(
      and(
        eq(profiles.id, user.id),
        isNull(profiles.deletedAt)
      )
    )
    .limit(1);

  return {
    id: user.id,
    email: user.email,
    profile: profile ?? null,
  };
});

/**
 * Require authentication. Redirects to /login if not authenticated.
 *
 * Use this in pages/layouts that require a logged-in user.
 *
 * @throws Redirect to /login
 *
 * @example
 * ```ts
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const user = await requireUser();
 *   return <div>Hello {user.email}</div>;
 * }
 * ```
 */
export const requireUser = cache(async (): Promise<AuthUser> => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

/**
 * Require admin access. Redirects to / if not admin.
 *
 * Use this in admin-only pages.
 *
 * @throws Redirect to / if user is not admin
 *
 * @example
 * ```ts
 * export default async function AdminPage() {
 *   const admin = await requireAdmin();
 *   return <div>Admin: {admin.email}</div>;
 * }
 * ```
 */
export const requireAdmin = cache(async (): Promise<AuthUser> => {
  const user = await requireUser();
  if (!user.profile?.isAdmin) {
    redirect("/");
  }
  return user;
});
