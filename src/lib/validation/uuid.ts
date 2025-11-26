/**
 * UUID Validation Utility
 *
 * Provides type-safe UUID validation for database operations.
 * Prevents invalid UUIDs from reaching the database layer.
 *
 * @module lib/validation/uuid
 */

/**
 * UUID v4 regex pattern.
 * Matches: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where y is 8, 9, A, or B (variant 1)
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * General UUID regex (any version).
 * More permissive, matches any valid UUID format.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID.
 *
 * @param value - The string to validate
 * @returns True if valid UUID format
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/**
 * Check if a string is a valid UUID v4.
 *
 * @param value - The string to validate
 * @returns True if valid UUID v4 format
 */
export function isValidUuidV4(value: string): boolean {
  return UUID_V4_REGEX.test(value);
}

/**
 * Validate a UUID and throw if invalid.
 *
 * @param value - The string to validate
 * @param paramName - Parameter name for error message
 * @throws Error if not a valid UUID
 */
export function assertValidUuid(value: string, paramName = "id"): void {
  if (!isValidUuid(value)) {
    throw new Error(`Invalid UUID format for ${paramName}`);
  }
}
