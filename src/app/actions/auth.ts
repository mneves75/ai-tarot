"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles, creditBalances } from "@/lib/db/schema";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";
import { ValidationError, AuthenticationError, toClientSafeError } from "@/lib/errors";
import { WELCOME_CREDITS } from "@/lib/config/constants";

/**
 * Auth Server Actions
 *
 * SECURITY: All authentication is handled via Supabase Auth.
 * The DAL pattern is used for authorization checks in protected routes.
 *
 * @module app/actions/auth
 */

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

// ============================================================
// TYPES
// ============================================================

export interface AuthActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const startTime = Date.now();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") ?? "unknown";

  try {
    // Validate input
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const validationResult = loginSchema.safeParse(rawData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError?.message ?? "Invalid input");
    }

    const { email, password } = validationResult.data;

    // Authenticate with Supabase
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed login attempt (security monitoring)
      await auditLog({
        event: "auth.login.failed",
        level: "warn" as AuditLogLevel,
        userId: undefined,
        sessionId: undefined,
        resource: "auth",
        resourceId: undefined,
        action: "login",
        success: false,
        errorMessage: error.message,
        durationMs: Date.now() - startTime,
        metadata: { email, reason: error.message, ipAddress },
      });

      throw new AuthenticationError(
        error.message === "Invalid login credentials"
          ? "Invalid email or password"
          : error.message
      );
    }

    // Log successful login
    await auditLog({
      event: "auth.login.success",
      level: "info" as AuditLogLevel,
      userId: data.user.id,
      sessionId: data.session?.access_token?.slice(-8),
      resource: "auth",
      resourceId: data.user.id,
      action: "login",
      success: true,
      errorMessage: undefined,
      durationMs: Date.now() - startTime,
      metadata: { email, ipAddress },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const safeError = toClientSafeError(error);
    return {
      success: false,
      error: safeError.message,
      code: safeError.code,
    };
  }
}

/**
 * Sign up with email and password.
 * Creates a new user and profile, grants welcome credits.
 */
export async function signupWithEmail(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const startTime = Date.now();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") ?? "unknown";

  try {
    // Validate input
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      name: formData.get("name") || undefined,
    };

    const validationResult = signupSchema.safeParse(rawData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError?.message ?? "Invalid input");
    }

    const { email, password, name } = validationResult.data;

    // Create user with Supabase Auth
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      await auditLog({
        event: "auth.signup.failed",
        level: "warn" as AuditLogLevel,
        userId: undefined,
        sessionId: undefined,
        resource: "auth",
        resourceId: undefined,
        action: "signup",
        success: false,
        errorMessage: error.message,
        durationMs: Date.now() - startTime,
        metadata: { email, reason: error.message, ipAddress },
      });

      throw new AuthenticationError(error.message);
    }

    if (!data.user) {
      throw new AuthenticationError("Failed to create user");
    }

    const newUser = data.user;
    const userEmail = newUser.email ?? email;

    // Create profile and credit balance in a transaction
    await db.transaction(async (tx) => {
      // Create profile
      await tx.insert(profiles).values({
        id: newUser.id,
        email: userEmail,
        name: name ?? null,
        locale: "pt-BR",
        isAdmin: false,
      });

      // Create credit balance with welcome credits
      await tx.insert(creditBalances).values({
        userId: newUser.id,
        credits: WELCOME_CREDITS,
      });
    });

    // Log successful signup
    await auditLog({
      event: "auth.signup.success",
      level: "info" as AuditLogLevel,
      userId: data.user.id,
      sessionId: data.session?.access_token?.slice(-8),
      resource: "auth",
      resourceId: data.user.id,
      action: "signup",
      success: true,
      errorMessage: undefined,
      durationMs: Date.now() - startTime,
      metadata: {
        email,
        welcomeCredits: WELCOME_CREDITS,
        ipAddress,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const safeError = toClientSafeError(error);
    return {
      success: false,
      error: safeError.message,
      code: safeError.code,
    };
  }
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google for authentication.
 */
export async function loginWithGoogle(): Promise<void> {
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    await auditLog({
      event: "auth.oauth.failed",
      level: "warn" as AuditLogLevel,
      userId: undefined,
      sessionId: undefined,
      resource: "auth",
      resourceId: undefined,
      action: "oauth_google",
      success: false,
      errorMessage: error.message,
      durationMs: undefined,
      metadata: { provider: "google", reason: error.message },
    });

    throw new AuthenticationError("Failed to initiate Google sign in");
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<void> {
  const startTime = Date.now();

  const supabase = await createClient();

  // Get current user for logging before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.auth.signOut();

  if (error) {
    await auditLog({
      event: "auth.logout.failed",
      level: "warn" as AuditLogLevel,
      userId: user?.id,
      sessionId: undefined,
      resource: "auth",
      resourceId: user?.id,
      action: "logout",
      success: false,
      errorMessage: error.message,
      durationMs: Date.now() - startTime,
      metadata: { reason: error.message },
    });

    throw new AuthenticationError("Failed to sign out");
  }

  await auditLog({
    event: "auth.logout.success",
    level: "info" as AuditLogLevel,
    userId: user?.id,
    sessionId: undefined,
    resource: "auth",
    resourceId: user?.id,
    action: "logout",
    success: true,
    errorMessage: undefined,
    durationMs: Date.now() - startTime,
    metadata: undefined,
  });

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Reset password - sends a password reset email.
 */
export async function resetPassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const startTime = Date.now();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";
  const ipAddress = headersList.get("x-forwarded-for") ?? "unknown";

  try {
    const email = formData.get("email");

    if (!email || typeof email !== "string") {
      throw new ValidationError("Email is required");
    }

    const emailSchema = z.string().email("Invalid email address");
    const validationResult = emailSchema.safeParse(email);

    if (!validationResult.success) {
      throw new ValidationError("Invalid email address");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/reset-password`,
    });

    // Note: We don't reveal if the email exists or not for security reasons
    // Always return success to prevent email enumeration attacks

    await auditLog({
      event: "auth.password_reset.requested",
      level: "info" as AuditLogLevel,
      userId: undefined,
      sessionId: undefined,
      resource: "auth",
      resourceId: undefined,
      action: "password_reset",
      success: !error,
      errorMessage: error?.message,
      durationMs: Date.now() - startTime,
      metadata: { email, ipAddress },
    });

    return { success: true };
  } catch (error) {
    const safeError = toClientSafeError(error);
    return {
      success: false,
      error: safeError.message,
      code: safeError.code,
    };
  }
}

/**
 * Update password - updates the user's password.
 * Called after user clicks reset link in email.
 */
export async function updatePassword(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const startTime = Date.now();

  try {
    const password = formData.get("password");

    if (!password || typeof password !== "string") {
      throw new ValidationError("Password is required");
    }

    if (password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError("Not authenticated");
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      await auditLog({
        event: "auth.password_update.failed",
        level: "warn" as AuditLogLevel,
        userId: user.id,
        sessionId: undefined,
        resource: "auth",
        resourceId: user.id,
        action: "password_update",
        success: false,
        errorMessage: error.message,
        durationMs: Date.now() - startTime,
        metadata: { reason: error.message },
      });

      throw new AuthenticationError(error.message);
    }

    await auditLog({
      event: "auth.password_update.success",
      level: "info" as AuditLogLevel,
      userId: user.id,
      sessionId: undefined,
      resource: "auth",
      resourceId: user.id,
      action: "password_update",
      success: true,
      errorMessage: undefined,
      durationMs: Date.now() - startTime,
      metadata: undefined,
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    const safeError = toClientSafeError(error);
    return {
      success: false,
      error: safeError.message,
      code: safeError.code,
    };
  }
}
