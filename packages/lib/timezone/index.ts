/**
 * Timezone utilities for minimal scheduling application
 *
 * Re-exports conversion functions and provides timezone detection utilities
 */

export * from "./conversions";

/**
 * Detect user's timezone from browser
 * @returns IANA timezone identifier (e.g., "America/New_York")
 */
export function detectUserTimezone(): string {
  if (typeof window === "undefined") {
    return "UTC";
  }

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn("Failed to detect timezone, defaulting to UTC", error);
    return "UTC";
  }
}

/**
 * Validate IANA timezone identifier
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

