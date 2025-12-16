/**
 * Minimal scheduler booking procedures
 *
 * Simplified booking management procedures for the minimal scheduling application
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { BookingStatus } from "@calcom/prisma/enums";
import { MinimalBookingService } from "@calcom/features/bookings/services/MinimalBookingService";
import { prisma } from "@calcom/prisma";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["bookings/minimalScheduler"] });

// Input schemas
export const ZListBookingsInputSchema = z.object({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	status: z.enum(["pending", "confirmed", "rejected", "cancelled"]).optional(),
});

export const ZApproveBookingInputSchema = z.object({
	id: z.string(),
});

export const ZRejectBookingInputSchema = z.object({
	id: z.string(),
	reason: z.string().optional(),
});

/**
 * List bookings for authenticated admin
 */
export async function listBookingsHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } };
	input: z.infer<typeof ZListBookingsInputSchema>;
}) {
	const { startDate, endDate, status } = input;

	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const statusFilter: BookingStatus[] | undefined = status
		? [status.toUpperCase() as BookingStatus]
		: undefined;

	// Get bookings with full details including description and timezone
	const bookings = await prisma.booking.findMany({
		where: {
			userId: ctx.user.id,
			...(startDate || endDate
				? {
						OR: [
							...(startDate ? [{ startTime: { gte: new Date(startDate) } }] : []),
							...(endDate ? [{ endTime: { lte: new Date(endDate) } }] : []),
						],
					}
				: {}),
			...(statusFilter ? { status: { in: statusFilter } } : {}),
		},
		orderBy: { startTime: "asc" },
		select: {
			id: true,
			uid: true,
			status: true,
			startTime: true,
			endTime: true,
			attendeeName: true,
			attendeeEmail: true,
			videoProvider: true,
			videoLink: true,
			timezone: true,
			description: true,
		},
	});

	return {
		bookings: bookings.map((b) => {
			// Map BookingStatus enum to lowercase string
			const statusMap: Record<BookingStatus, "pending" | "confirmed" | "rejected" | "cancelled"> = {
				[BookingStatus.PENDING]: "pending",
				[BookingStatus.CONFIRMED]: "confirmed",
				[BookingStatus.REJECTED]: "rejected",
				[BookingStatus.CANCELLED]: "cancelled",
				[BookingStatus.ACCEPTED]: "confirmed", // Map ACCEPTED to confirmed for compatibility
				[BookingStatus.AWAITING_HOST]: "pending", // Map AWAITING_HOST to pending
			};

			return {
				id: b.uid,
				startTime: b.startTime.toISOString(),
				endTime: b.endTime.toISOString(),
				attendeeName: b.attendeeName || "",
				attendeeEmail: b.attendeeEmail || "",
				notes: b.description || undefined,
				videoProvider: (b.videoProvider as "google-meet" | "zoom") || undefined,
				videoLink: b.videoLink || undefined,
				status: statusMap[b.status] || "pending",
				timezone: b.timezone || "UTC",
			};
		}),
	};
}

/**
 * Approve a pending booking
 */
export async function approveBookingHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } };
	input: z.infer<typeof ZApproveBookingInputSchema>;
}) {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const bookingService = new MinimalBookingService(prisma);

	// Get booking details first
	const booking = await prisma.booking.findFirst({
		where: {
			uid: input.id,
			userId: ctx.user.id,
		},
		include: {
			user: {
				select: {
					timeZone: true,
				},
			},
		},
	});

	if (!booking) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Booking not found or not owned by user",
		});
	}

	if (booking.status !== BookingStatus.PENDING) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Booking is not in pending status",
		});
	}

	// Generate video link if videoProvider is set
	let videoLink: string | undefined;
	let calendarEventId: string | undefined;

	if (booking.videoProvider === "google-meet") {
		try {
			// Get calendar integration
			const integration = await prisma.calendarIntegration.findFirst({
				where: {
					userId: ctx.user.id,
					type: "google-calendar",
					syncStatus: "active",
				},
			});

			if (integration) {
				// TODO: Create OAuth2Client from integration tokens
				// For now, we'll skip calendar event creation and video link generation
				// This will be implemented when calendar integration is complete
				log.warn("Calendar integration not yet fully implemented for booking approval");
			}
		} catch (error) {
			log.error("Failed to generate video link or create calendar event", { error });
			// Continue with approval even if video/calendar fails
		}
	}

	// Approve booking
	const approved = await bookingService.approveBooking(input.id, ctx.user.id, {
		calendarEventId,
		videoLink,
	});

	return {
		id: approved.uid,
		status: "confirmed" as const,
		calendarEventId: approved.calendarEventId || undefined,
		videoLink: approved.videoLink || undefined,
	};
}

/**
 * Reject a pending booking
 */
export async function rejectBookingHandler({
	ctx,
	input,
}: {
	ctx: { user: { id: number } };
	input: z.infer<typeof ZRejectBookingInputSchema>;
}) {
	if (!ctx.user) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Not authenticated",
		});
	}

	const bookingService = new MinimalBookingService(prisma);

	const rejected = await bookingService.rejectBooking(input.id, ctx.user.id, input.reason);

	return {
		id: rejected.uid,
		status: "rejected" as const,
		rejectionReason: input.reason,
	};
}

