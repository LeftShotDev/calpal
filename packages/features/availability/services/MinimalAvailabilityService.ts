/**
 * Minimal Availability Service for minimal scheduling application
 *
 * Calculates available time slots by combining:
 * - Availability blocks (admin-defined time windows)
 * - Calendar events (busy times from Google Calendar)
 * - Existing bookings (pending and confirmed)
 */

import { prisma } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { PrismaClient } from "@calcom/prisma";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["MinimalAvailabilityService"] });

export interface TimeSlot {
	startTime: Date; // UTC
	endTime: Date; // UTC
	displayStartTime: string; // ISO string in user timezone
	displayEndTime: string; // ISO string in user timezone
}

export interface CalculateAvailableSlotsInput {
	userId: number;
	startDate: Date;
	endDate: Date;
	userTimezone: string; // IANA timezone identifier
	slotDurationMinutes?: number; // Default: 30 minutes
}

export class MinimalAvailabilityService {
	constructor(private readonly prismaClient: PrismaClient = prisma) {}

	/**
	 * Calculate available time slots for a given date range
	 * Combines availability blocks, calendar events, and bookings
	 */
	async calculateAvailableSlots(
		input: CalculateAvailableSlotsInput
	): Promise<TimeSlot[]> {
		const { userId, startDate, endDate, userTimezone, slotDurationMinutes = 30 } = input;

		log.debug("Calculating available slots", {
			userId,
			startDate,
			endDate,
			userTimezone,
			slotDurationMinutes,
		});

		// Get availability blocks for the user
		const availabilityBlocks = await this.prismaClient.availabilityBlock.findMany({
			where: {
				userId,
				isActive: true,
			},
		});

		if (availabilityBlocks.length === 0) {
			log.debug("No availability blocks found", { userId });
			return [];
		}

		// Get calendar events (busy times)
		const calendarEvents = await this.getCalendarEvents(userId, startDate, endDate);

		// Get existing bookings (pending and confirmed)
		const bookings = await this.prismaClient.booking.findMany({
			where: {
				userId,
				status: {
					in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
				},
				OR: [
					{
						// Booking overlaps with date range
						AND: [
							{ startTime: { lte: endDate } },
							{ endTime: { gte: startDate } },
						],
					},
				],
			},
		});

		// Generate time slots from availability blocks
		const allSlots: TimeSlot[] = [];

		for (const block of availabilityBlocks) {
			const slots = this.generateSlotsFromBlock(
				block,
				startDate,
				endDate,
				userTimezone,
				slotDurationMinutes
			);
			allSlots.push(...slots);
		}

		// Remove slots that overlap with calendar events or bookings
		const availableSlots = allSlots.filter((slot) => {
			// Check calendar events
			const conflictsWithCalendar = calendarEvents.some((event) => {
				return this.slotsOverlap(slot, {
					startTime: event.startTime,
					endTime: event.endTime,
				});
			});

			if (conflictsWithCalendar) {
				return false;
			}

			// Check bookings
			const conflictsWithBooking = bookings.some((booking) => {
				return this.slotsOverlap(slot, {
					startTime: booking.startTime,
					endTime: booking.endTime,
				});
			});

			return !conflictsWithBooking;
		});

		// Sort by start time
		availableSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

		log.debug("Calculated available slots", {
			userId,
			totalSlots: availableSlots.length,
		});

		return availableSlots;
	}

	/**
	 * Generate time slots from an availability block
	 */
	private generateSlotsFromBlock(
		block: {
			dayOfWeek: number;
			startTime: Date;
			endTime: Date;
			timezone: string;
		},
		startDate: Date,
		endDate: Date,
		userTimezone: string,
		slotDurationMinutes: number
	): TimeSlot[] {
		const slots: TimeSlot[] = [];
		const slotDurationMs = slotDurationMinutes * 60 * 1000;

		// Iterate through each day in the date range
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			const dayOfWeek = currentDate.getDay();

			// Check if this day matches the block's day of week
			if (dayOfWeek === block.dayOfWeek) {
				// Get the time components from the block
				const blockStartHours = block.startTime.getHours();
				const blockStartMinutes = block.startTime.getMinutes();
				const blockEndHours = block.endTime.getHours();
				const blockEndMinutes = block.endTime.getMinutes();

				// Create date for this day in the block's timezone
				const dayStart = new Date(currentDate);
				dayStart.setHours(blockStartHours, blockStartMinutes, 0, 0);

				const dayEnd = new Date(currentDate);
				dayEnd.setHours(blockEndHours, blockEndMinutes, 0, 0);

				// Convert to UTC for comparison
				const dayStartUTC = this.convertToUTC(dayStart, block.timezone);
				const dayEndUTC = this.convertToUTC(dayEnd, block.timezone);

				// Generate slots for this day
				let slotStart = new Date(Math.max(dayStartUTC.getTime(), startDate.getTime()));
				const maxEnd = Math.min(dayEndUTC.getTime(), endDate.getTime());

				while (slotStart.getTime() + slotDurationMs <= maxEnd) {
					const slotEnd = new Date(slotStart.getTime() + slotDurationMs);

					// Format display times in user timezone
					const displayStartTime = formatInTimeZone(
						slotStart,
						userTimezone,
						"yyyy-MM-dd'T'HH:mm:ssXXX"
					);
					const displayEndTime = formatInTimeZone(
						slotEnd,
						userTimezone,
						"yyyy-MM-dd'T'HH:mm:ssXXX"
					);

					slots.push({
						startTime: slotStart,
						endTime: slotEnd,
						displayStartTime,
						displayEndTime,
					});

					slotStart = new Date(slotStart.getTime() + slotDurationMs);
				}
			}

			// Move to next day
			currentDate.setDate(currentDate.getDate() + 1);
			currentDate.setHours(0, 0, 0, 0);
		}

		return slots;
	}

	/**
	 * Get calendar events for a user in a date range
	 */
	private async getCalendarEvents(
		userId: number,
		startDate: Date,
		endDate: Date
	): Promise<Array<{ startTime: Date; endTime: Date }>> {
		// Get active calendar integration
		const integration = await this.prismaClient.calendarIntegration.findFirst({
			where: {
				userId,
				type: "google-calendar",
				syncStatus: "active",
			},
		});

		if (!integration) {
			return [];
		}

		// Get calendar events that overlap with date range
		const events = await this.prismaClient.calendarEvent.findMany({
			where: {
				calendarIntegrationId: integration.id,
				isBusy: true,
				OR: [
					{
						// Event overlaps with date range
						AND: [
							{ startTime: { lte: endDate } },
							{ endTime: { gte: startDate } },
						],
					},
				],
			},
		});

		return events.map((e) => ({
			startTime: e.startTime,
			endTime: e.endTime,
		}));
	}

	/**
	 * Check if two time slots overlap
	 */
	private slotsOverlap(
		slot1: { startTime: Date; endTime: Date },
		slot2: { startTime: Date; endTime: Date }
	): boolean {
		return slot1.startTime < slot2.endTime && slot1.endTime > slot2.startTime;
	}

	/**
	 * Convert a date from a timezone to UTC
	 */
	private convertToUTC(date: Date, timezone: string): Date {
		// Use date-fns-tz to convert from the block's timezone to UTC
		return fromZonedTime(date, timezone);
	}
}

