/**
 * Minimal Booking Service for minimal scheduling application
 *
 * Simplified booking service focused on core scheduling functionality:
 * - Create pending bookings (awaiting admin approval)
 * - Approve/reject bookings
 * - Query bookings by user
 */

import { prisma } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import type { PrismaClient } from "@calcom/prisma";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	sendPendingBookingConfirmation,
	notifyAdminOfPendingBooking,
	sendBookingConfirmation,
	sendBookingRejection,
} from "@calcom/lib/email";
import logger from "@calcom/lib/logger";

const log = logger.getSubLogger({ prefix: ["MinimalBookingService"] });

const createBookingInputSchema = z.object({
	userId: z.number(),
	startTime: z.date(),
	endTime: z.date(),
	attendeeName: z.string().min(1).max(100),
	attendeeEmail: z.string().email(),
	notes: z.string().max(500).optional(),
	videoProvider: z.enum(["google-meet", "zoom"]).optional(),
	timezone: z.string(),
	title: z.string().optional(),
});

export type CreatePendingBookingInput = z.infer<typeof createBookingInputSchema>;

export interface BookingResult {
	id: number;
	uid: string;
	status: BookingStatus;
	startTime: Date;
	endTime: Date;
	attendeeName: string | null;
	attendeeEmail: string | null;
	videoProvider: string | null;
	videoLink: string | null;
	calendarEventId: string | null;
}

export class MinimalBookingService {
	constructor(private readonly prismaClient: PrismaClient = prisma) { }

	/**
	 * Create a pending booking
	 * Validates availability and prevents double-booking
	 */
	async createPendingBooking(input: CreatePendingBookingInput): Promise<BookingResult> {
		// Validate input
		const validated = createBookingInputSchema.parse(input);

		// Validate booking duration (15 minutes to 8 hours)
		const durationMs = validated.endTime.getTime() - validated.startTime.getTime();
		const minDuration = 15 * 60 * 1000; // 15 minutes
		const maxDuration = 8 * 60 * 60 * 1000; // 8 hours

		if (durationMs < minDuration) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Booking duration must be at least 15 minutes",
			});
		}

		if (durationMs > maxDuration) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Booking duration cannot exceed 8 hours",
			});
		}

		// Validate start time is in the future
		if (validated.startTime < new Date()) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot book time slots in the past",
			});
		}

		// Use transaction to prevent double-booking
		return await this.prismaClient.$transaction(async (tx) => {
			// Check for overlapping bookings (pending or confirmed)
			const overlappingBooking = await tx.booking.findFirst({
				where: {
					userId: validated.userId,
					status: {
						in: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
					},
					OR: [
						{
							// New booking starts during existing booking
							AND: [
								{ startTime: { lte: validated.startTime } },
								{ endTime: { gt: validated.startTime } },
							],
						},
						{
							// New booking ends during existing booking
							AND: [
								{ startTime: { lt: validated.endTime } },
								{ endTime: { gte: validated.endTime } },
							],
						},
						{
							// New booking completely contains existing booking
							AND: [
								{ startTime: { gte: validated.startTime } },
								{ endTime: { lte: validated.endTime } },
							],
						},
					],
				},
			});

			if (overlappingBooking) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Time slot is no longer available",
				});
			}

			// Create booking with pending status
			const booking = await tx.booking.create({
				data: {
					uid: `booking-${Date.now()}-${Math.random().toString(36).substring(7)}`,
					userId: validated.userId,
					startTime: validated.startTime,
					endTime: validated.endTime,
					title: validated.title || `Meeting with ${validated.attendeeName}`,
					description: validated.notes,
					status: BookingStatus.PENDING,
					attendeeName: validated.attendeeName,
					attendeeEmail: validated.attendeeEmail,
					videoProvider: validated.videoProvider || null,
					timezone: validated.timezone,
					// Note: videoLink and calendarEventId are null until approval
				},
			});

			log.info("Created pending booking", {
				bookingId: booking.id,
				userId: validated.userId,
				startTime: validated.startTime,
			});

			// Send notifications (non-blocking)
			try {
				// Get admin user info for email
				const admin = await tx.user.findUnique({
					where: { id: validated.userId },
					select: { name: true, email: true },
				});

				if (admin) {
					// Send pending confirmation to attendee
					await sendPendingBookingConfirmation(
						validated.attendeeEmail,
						validated.attendeeName,
						{
							startTime: validated.startTime,
							endTime: validated.endTime,
							timezone: validated.timezone,
							adminName: admin.name || "Admin",
						}
					);

					// Notify admin of pending booking
					await notifyAdminOfPendingBooking(
						admin.email,
						admin.name || "Admin",
						{
							bookingId: booking.uid,
							attendeeName: validated.attendeeName,
							attendeeEmail: validated.attendeeEmail,
							startTime: validated.startTime,
							endTime: validated.endTime,
							timezone: validated.timezone,
							notes: validated.notes,
						}
					);
				}
			} catch (error) {
				// Log but don't fail booking creation if email fails
				log.error("Failed to send booking notifications", { error, bookingId: booking.id });
			}

			return {
				id: booking.id,
				uid: booking.uid,
				status: booking.status,
				startTime: booking.startTime,
				endTime: booking.endTime,
				attendeeName: booking.attendeeName,
				attendeeEmail: booking.attendeeEmail,
				videoProvider: booking.videoProvider,
				videoLink: booking.videoLink,
				calendarEventId: booking.calendarEventId,
			};
		});
	}

	/**
	 * Approve a pending booking
	 * Creates calendar event and sends confirmation email
	 */
	async approveBooking(
		bookingId: string,
		userId: number,
		options?: {
			calendarEventId?: string;
			videoLink?: string;
		}
	): Promise<BookingResult> {
		const booking = await this.prismaClient.booking.findFirst({
			where: {
				uid: bookingId,
				userId,
				status: BookingStatus.PENDING,
			},
		});

		if (!booking) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Pending booking not found",
			});
		}

		// Update booking to confirmed status
		const updated = await this.prismaClient.booking.update({
			where: { id: booking.id },
			data: {
				status: BookingStatus.CONFIRMED,
				calendarEventId: options?.calendarEventId || null,
				videoLink: options?.videoLink || null,
			},
		});

		log.info("Approved booking", { bookingId: updated.uid, userId });

		// Send confirmation email (non-blocking)
		if (updated.attendeeEmail && updated.attendeeName) {
			try {
				const admin = await this.prismaClient.user.findUnique({
					where: { id: userId },
					select: { name: true },
				});

				await sendBookingConfirmation(
					updated.attendeeEmail,
					updated.attendeeName,
					{
						startTime: updated.startTime,
						endTime: updated.endTime,
						timezone: updated.timezone || "UTC",
						adminName: admin?.name || "Admin",
						videoLink: updated.videoLink || undefined,
						videoProvider: (updated.videoProvider as "google-meet" | "zoom") || undefined,
					}
				);
			} catch (error) {
				log.error("Failed to send confirmation email", { error, bookingId: updated.uid });
			}
		}

		return {
			id: updated.id,
			uid: updated.uid,
			status: updated.status,
			startTime: updated.startTime,
			endTime: updated.endTime,
			attendeeName: updated.attendeeName,
			attendeeEmail: updated.attendeeEmail,
			videoProvider: updated.videoProvider,
			videoLink: updated.videoLink,
			calendarEventId: updated.calendarEventId,
		};
	}

	/**
	 * Reject a pending booking
	 */
	async rejectBooking(
		bookingId: string,
		userId: number,
		reason?: string
	): Promise<BookingResult> {
		const booking = await this.prismaClient.booking.findFirst({
			where: {
				uid: bookingId,
				userId,
				status: BookingStatus.PENDING,
			},
		});

		if (!booking) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Pending booking not found",
			});
		}

		// Update booking to rejected status
		const updated = await this.prismaClient.booking.update({
			where: { id: booking.id },
			data: {
				status: BookingStatus.REJECTED,
				rejectionReason: reason || null,
			},
		});

		log.info("Rejected booking", { bookingId: updated.uid, userId, reason });

		// Send rejection email (non-blocking)
		if (updated.attendeeEmail && updated.attendeeName) {
			try {
				const admin = await this.prismaClient.user.findUnique({
					where: { id: userId },
					select: { name: true },
				});

				await sendBookingRejection(
					updated.attendeeEmail,
					updated.attendeeName,
					{
						startTime: updated.startTime,
						endTime: updated.endTime,
						timezone: updated.timezone || "UTC",
						adminName: admin?.name || "Admin",
					},
					reason
				);
			} catch (error) {
				log.error("Failed to send rejection email", { error, bookingId: updated.uid });
			}
		}

		return {
			id: updated.id,
			uid: updated.uid,
			status: updated.status,
			startTime: updated.startTime,
			endTime: updated.endTime,
			attendeeName: updated.attendeeName,
			attendeeEmail: updated.attendeeEmail,
			videoProvider: updated.videoProvider,
			videoLink: updated.videoLink,
			calendarEventId: updated.calendarEventId,
		};
	}

	/**
	 * Get bookings for a user (admin)
	 */
	async getBookingsByUser(
		userId: number,
		options?: {
			startDate?: Date;
			endDate?: Date;
			status?: BookingStatus[];
		}
	): Promise<BookingResult[]> {
		const where: {
			userId: number;
			OR?: Array<{ startTime?: { gte: Date }; endTime?: { lte: Date } }>;
			status?: { in: BookingStatus[] };
		} = {
			userId,
		};

		if (options?.startDate || options?.endDate) {
			where.OR = [];
			if (options.startDate) {
				where.OR.push({
					startTime: { gte: options.startDate },
				});
			}
			if (options.endDate) {
				where.OR.push({
					endTime: { lte: options.endDate },
				});
			}
		}

		if (options?.status && options.status.length > 0) {
			where.status = { in: options.status };
		}

		const bookings = await this.prismaClient.booking.findMany({
			where,
			orderBy: { startTime: "asc" },
		});

		return bookings.map((b) => ({
			id: b.id,
			uid: b.uid,
			status: b.status,
			startTime: b.startTime,
			endTime: b.endTime,
			attendeeName: b.attendeeName,
			attendeeEmail: b.attendeeEmail,
			videoProvider: b.videoProvider,
			videoLink: b.videoLink,
			calendarEventId: b.calendarEventId,
		}));
	}
}

