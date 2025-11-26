"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/dal";
import { auditLog, type AuditLogLevel } from "@/lib/audit/logger";
import { ValidationError, NotFoundError, toClientSafeError } from "@/lib/errors";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/config/constants";

/**
 * Profile Server Actions
 *
 * @module app/actions/profile
 */

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  locale: z.enum(SUPPORTED_LANGUAGES as readonly [string, ...string[]]).optional(),
});

// ============================================================
// TYPES
// ============================================================

export interface ProfileActionResult {
  success: boolean;
  error?: string;
  code?: string;
}

export interface ProfileData {
  id: string;
  email: string;
  name: string | null;
  locale: SupportedLanguage;
  isAdmin: boolean;
  createdAt: Date;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  const startTime = Date.now();

  try {
    // Get authenticated user
    const authUser = await requireUser();

    // Validate input
    const rawData = {
      name: formData.get("name") || undefined,
      locale: formData.get("locale") || undefined,
    };

    const validationResult = updateProfileSchema.safeParse(rawData);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      throw new ValidationError(firstError?.message ?? "Invalid input");
    }

    const data = validationResult.data;

    // Build update object (only include changed fields)
    const updateData: Partial<{
      name: string | null;
      locale: string;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name || null;
    }

    if (data.locale !== undefined) {
      updateData.locale = data.locale;
    }

    // Update profile
    const [updated] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, authUser.id))
      .returning();

    if (!updated) {
      throw new NotFoundError("Profile");
    }

    await auditLog({
      event: "profile.updated",
      level: "info" as AuditLogLevel,
      userId: authUser.id,
      sessionId: undefined,
      resource: "profile",
      resourceId: authUser.id,
      action: "update",
      success: true,
      errorMessage: undefined,
      durationMs: Date.now() - startTime,
      metadata: { updatedFields: Object.keys(data) },
    });

    revalidatePath("/profile");
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
 * Get the current user's profile data.
 */
export async function getProfile(): Promise<ProfileData | null> {
  try {
    const authUser = await requireUser();

    if (!authUser.profile) {
      return null;
    }

    return {
      id: authUser.profile.id,
      email: authUser.profile.email,
      name: authUser.profile.name,
      locale: authUser.profile.locale as SupportedLanguage,
      isAdmin: authUser.profile.isAdmin,
      createdAt: authUser.profile.createdAt,
    };
  } catch {
    return null;
  }
}
