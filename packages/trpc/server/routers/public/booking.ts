/**
 * Public booking router for minimal scheduling application
 *
 * Public endpoints (no authentication required) for booking functionality
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isValidTimezone } from "@calcom/lib/timezone";
import { MinimalAvailabilityService } from "@calcom/features/availability/services/MinimalAvailabilityService";
import { MinimalBookingService } from "@calcom/features/bookings/services/MinimalBookingService";
import { prisma } from "@calcom/prisma";
import publicProcedure from "../../procedures/publicProcedure";
import { publicBookingRateLimit } from "../../middlewares/publicBookingRateLimit";
import { router } from "../../trpc";

// Input schemas
const getAvailabilityInputSchema = z.object({
	username: z.string().min(1),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
	timezone: z.string().optional(),
});

const createBookingInputSchema = z.object({
	username: z.string().min(1),
	startTime: z.string().datetime(),
	endTime: z.string().datetime(),
	attendeeName: z.string().min(1).max(100),
	attendeeEmail: z.string().email(),
	notes: z.string().max(500).optional(),
	videoProvider: z.enum(["google-meet", "zoom"]).optional(),
	timezone: z.string(),
});

// Rate-limited procedure for booking creation
const rateLimitedPublicProcedure = publicProcedure.use(publicBookingRateLimit);

export const publicBookingRouter = router({
	/**
	 * Get available time slots for a given admin user
	 */
	getAvailability: publicProcedure.input(getAvailabilityInputSchema).query(async ({ input }) => {
		const { username, startDate, endDate, timezone } = input;

		// Find user by username
		const user = await prisma.user.findUnique({
			where: { username },
			select: {
				id: true,
				timeZone: true,
				name: true,
			},
		});

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Admin user not found",
			});
		}

		// Validate timezone if provided
		const userTimezone = timezone || user.timeZone || "UTC";
		if (!isValidTimezone(userTimezone)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid timezone",
			});
		}

		// Parse dates
		const start = new Date(`${startDate}T00:00:00Z`);
		const end = new Date(`${endDate}T23:59:59Z`);

		if (isNaN(start.getTime()) || isNaN(end.getTime())) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid date range",
			});
		}

		if (start >= end) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Start date must be before end date",
			});
		}

		// Calculate available slots
		const availabilityService = new MinimalAvailabilityService(prisma);
		const slots = await availabilityService.calculateAvailableSlots({
			userId: user.id,
			startDate: start,
			endDate: end,
			userTimezone,
		});

		return {
			slots: slots.map((slot) => ({
				startTime: slot.startTime.toISOString(),
				endTime: slot.endTime.toISOString(),
				displayStartTime: slot.displayStartTime,
				displayEndTime: slot.displayEndTime,
				isAvailable: true,
			})),
			adminTimezone: user.timeZone || "UTC",
		};
	}),

	/**
	 * Create a new booking (public, no auth required)
	 * Rate limited to 10 bookings per IP per hour
	 */
	createBooking: rateLimitedPublicProcedure.input(createBookingInputSchema).mutation(async ({ input }) => {
		const {
			username,
			startTime: startTimeStr,
			endTime: endTimeStr,
			attendeeName,
			attendeeEmail,
			notes,
			videoProvider,
			timezone,
		} = input;

		// Find user by username
		const user = await prisma.user.findUnique({
			where: { username },
			select: {
				id: true,
				name: true,
			},
		});

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Admin user not found",
			});
		}

		// Validate timezone
		if (!isValidTimezone(timezone)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid timezone",
			});
		}

		// Parse datetime strings
		const startTime = new Date(startTimeStr);
		const endTime = new Date(endTimeStr);

		if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid datetime format",
			});
		}

		// Create booking
		const bookingService = new MinimalBookingService(prisma);
		const booking = await bookingService.createPendingBooking({
			userId: user.id,
			startTime,
			endTime,
			attendeeName,
			attendeeEmail,
			notes,
			videoProvider,
			timezone,
		});

		return {
			bookingId: booking.uid,
			status: "pending" as const,
			confirmationMessage: `Your booking request has been submitted. You will receive a confirmation email once ${user.name || "the admin"} approves your booking.`,
		};
	}),
});

