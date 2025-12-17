/**
 * Timezone conversion utilities using date-fns-tz
 *
 * These utilities handle timezone conversions for the minimal scheduling application.
 * All datetime values are stored in UTC in the database and converted to user/admin timezones for display.
 */

import { formatInTimeZone, /* toZonedTime, */ fromZonedTime } from "date-fns-tz";

/**
 * Convert a UTC datetime to a specific timezone for display
 * @param utcDate - Date object in UTC
 * @param targetTimezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns ISO datetime string in target timezone
 */
export function convertUTCToTimezone(utcDate: Date, targetTimezone: string): string {
	return formatInTimeZone(utcDate, targetTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Convert a datetime from a source timezone to UTC
 * @param zonedDate - Date object representing time in source timezone
 * @param sourceTimezone - IANA timezone identifier
 * @returns Date object in UTC
 */
export function convertTimezoneToUTC(zonedDate: Date, sourceTimezone: string): Date {
	return fromZonedTime(zonedDate, sourceTimezone);
}

/**
 * Convert a datetime from one timezone to another
 * @param date - Date object
 * @param sourceTimezone - Source IANA timezone identifier
 * @param targetTimezone - Target IANA timezone identifier
 * @returns ISO datetime string in target timezone
 */
export function convertBetweenTimezones(
	date: Date,
	sourceTimezone: string,
	targetTimezone: string
): string {
	// First convert to UTC, then to target timezone
	const utcDate = fromZonedTime(date, sourceTimezone);
	return formatInTimeZone(utcDate, targetTimezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Format a UTC datetime for display in a specific timezone
 * @param utcDate - Date object in UTC
 * @param timezone - IANA timezone identifier
 * @param format - date-fns format string (default: "yyyy-MM-dd HH:mm")
 * @returns Formatted date string
 */
export function formatInTimezone(
	utcDate: Date,
	timezone: string,
	format: string = "yyyy-MM-dd HH:mm"
): string {
	return formatInTimeZone(utcDate, timezone, format);
}

/**
 * Get current time in a specific timezone
 * @param timezone - IANA timezone identifier
 * @returns ISO datetime string
 */
export function getCurrentTimeInTimezone(timezone: string): string {
	const now = new Date();
	return formatInTimeZone(now, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Parse a datetime string in a specific timezone and convert to UTC
 * @param dateString - ISO datetime string (e.g., "2025-12-16T14:30:00")
 * @param sourceTimezone - IANA timezone identifier where the date string is interpreted
 * @returns Date object in UTC
 */
export function parseTimezoneToUTC(dateString: string, sourceTimezone: string): Date {
	// Create a date object assuming the string is in the source timezone
	const localDate = new Date(dateString);
	return fromZonedTime(localDate, sourceTimezone);
}

